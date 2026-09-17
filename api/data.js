// api/data.js — Vercel Serverless Function + Neon PostgreSQL
// Multi-branch support for Deportivo Italia Academy

import { neon } from "@neondatabase/serverless";

async function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set. Check your environment variables.");
  }
  const sql = neon(process.env.DATABASE_URL);

  // Create tables on first run (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS sedes (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      estado TEXT NOT NULL DEFAULT 'activa',
      direccion TEXT,
      telefono TEXT,
      email TEXT,
      logo TEXT,
      imagen_principal TEXT,
      descripcion TEXT,
      fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_data (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      sede_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Add sede_id column if it doesn't exist (for existing installations)
  try {
    await sql`ALTER TABLE app_data ADD COLUMN IF NOT EXISTS sede_id TEXT`;
  } catch (e) {
    // Column might already exist
  }

  // Create index for sede_id queries
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_app_data_sede_id ON app_data(sede_id)`;
  } catch (e) {
    // Index might already exist
  }

  return sql;
}

function filterBySede(data, sedeId) {
  if (!data || !Array.isArray(data)) return [];
  if (!sedeId) return data; // If no sede_id specified, return all (for superadmin)
  return data.filter(item => item.sede_id === sedeId);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const sql = await getDb();
    const { sede_id } = req.query; // Optional: filter by branch

    // ── GET ──
    if (req.method === "GET") {
      const { key } = req.query;

      // Special endpoint: get all sedes
      if (key === "sedes") {
        const rows = await sql`SELECT * FROM sedes ORDER BY fecha_creacion`;
        return res.status(200).json(rows);
      }

      // Special endpoint: get single sede
      if (key === "sede") {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Missing sede id" });
        const rows = await sql`SELECT * FROM sedes WHERE id = ${id}`;
        return res.status(200).json(rows[0] || null);
      }

      // Regular data keys with sede filtering
      if (key) {
        const rows = await sql`SELECT value, sede_id FROM app_data WHERE key = ${key}`;
        if (rows.length === 0) return res.status(200).json(null);
        
        // If sede_id specified, filter the array
        if (sede_id) {
          const filtered = filterBySede(rows[0].value, sede_id);
          return res.status(200).json(filtered);
        }
        return res.status(200).json(rows[0].value);
      }

      // Return all data (with optional sede filtering)
      const rows = await sql`SELECT key, value, sede_id FROM app_data`;
      const out = {};
      rows.forEach(r => {
        if (sede_id) {
          out[r.key] = filterBySede(r.value, sede_id);
        } else {
          out[r.key] = r.value;
        }
      });
      return res.status(200).json(out);
    }

    // ── POST ── Upsert data for a specific sede
    if (req.method === "POST") {
      const { key, value, sede_id: bodySedeId } = req.body;
      const targetSedeId = bodySedeId || sede_id;
      
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Missing key or value" });
      }

      // For sedes table
      if (key === "sedes") {
        if (!value.id || !value.nombre || !value.codigo) {
          return res.status(400).json({ error: "Sede requires id, nombre, codigo" });
        }
        await sql`
          INSERT INTO sedes (id, nombre, codigo, estado, direccion, telefono, email, logo, imagen_principal, descripcion, updated_at)
          VALUES (${value.id}, ${value.nombre}, ${value.codigo}, ${value.estado || 'activa'}, ${value.direccion}, ${value.telefono}, ${value.email}, ${value.logo}, ${value.imagen_principal}, ${value.descripcion}, NOW())
          ON CONFLICT (id) DO UPDATE SET 
            nombre = EXCLUDED.nombre,
            codigo = EXCLUDED.codigo,
            estado = EXCLUDED.estado,
            direccion = EXCLUDED.direccion,
            telefono = EXCLUDED.telefono,
            email = EXCLUDED.email,
            logo = EXCLUDED.logo,
            imagen_principal = EXCLUDED.imagen_principal,
            descripcion = EXCLUDED.descripcion,
            updated_at = NOW()
        `;
        return res.status(200).json({ success: true });
      }

      if (key === "sede") {
        // Update single sede
        const { id, ...updates } = value;
        if (!id) return res.status(400).json({ error: "Missing sede id" });
        
        const setClause = Object.keys(updates).map(k => `${k} = ${updates[k]}`).join(", ");
        if (setClause) {
          await sql`UPDATE sedes SET ${sql(setClause)}, updated_at = NOW() WHERE id = ${id}`;
        }
        return res.status(200).json({ success: true });
      }

      // For app_data with sede_id
      if (!targetSedeId) {
        return res.status(400).json({ error: "sede_id is required for data operations" });
      }

      // Get existing data for this key
      const existingRows = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      let existingData = existingRows[0]?.value || [];
      
      if (!Array.isArray(existingData)) existingData = [];

      // Remove any existing items for this sede_id
      const otherSedesData = existingData.filter(item => item.sede_id !== targetSedeId);
      
      // Add new data with sede_id
      const newData = Array.isArray(value) 
        ? value.map(item => ({ ...item, sede_id: targetSedeId }))
        : [{ ...value, sede_id: targetSedeId }];

      const mergedData = [...otherSedesData, ...newData];

      await sql`
        INSERT INTO app_data (key, value, sede_id, updated_at)
        VALUES (${key}, ${JSON.stringify(mergedData)}, ${targetSedeId}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;

      return res.status(200).json({ success: true });
    }

    // ── PUT ── Update specific item within a key for a sede
    if (req.method === "PUT") {
      const { key, itemId, updates, sede_id: bodySedeId } = req.body;
      const targetSedeId = bodySedeId || sede_id;
      
      if (!key || !itemId || !updates || !targetSedeId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingRows = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      let existingData = existingRows[0]?.value || [];
      if (!Array.isArray(existingData)) existingData = [];

      const index = existingData.findIndex(item => item.id === itemId && item.sede_id === targetSedeId);
      if (index === -1) {
        return res.status(404).json({ error: "Item not found" });
      }

      existingData[index] = { ...existingData[index], ...updates };

      await sql`
        UPDATE app_data SET value = ${JSON.stringify(existingData)}, updated_at = NOW() WHERE key = ${key}
      `;

      return res.status(200).json({ success: true, item: existingData[index] });
    }

    // ── DELETE ──
    if (req.method === "DELETE") {
      const { key, itemId, sede_id: bodySedeId } = req.body;
      const targetSedeId = bodySedeId || sede_id;
      
      if (!key || !targetSedeId) {
        return res.status(400).json({ error: "Missing key or sede_id" });
      }

      // Delete entire key (for sedes)
      if (key === "sedes" && itemId) {
        await sql`DELETE FROM sedes WHERE id = ${itemId}`;
        return res.status(200).json({ success: true });
      }

      // Delete specific item from array
      if (itemId) {
        const existingRows = await sql`SELECT value FROM app_data WHERE key = ${key}`;
        let existingData = existingRows[0]?.value || [];
        if (!Array.isArray(existingData)) existingData = [];

        const filtered = existingData.filter(item => !(item.id === itemId && item.sede_id === targetSedeId));

        await sql`
          UPDATE app_data SET value = ${JSON.stringify(filtered)}, updated_at = NOW() WHERE key = ${key}
        `;

        return res.status(200).json({ success: true });
      }

      // Delete entire key for a sede
      const existingRows = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      let existingData = existingRows[0]?.value || [];
      if (!Array.isArray(existingData)) existingData = [];

      const filtered = existingData.filter(item => item.sede_id !== targetSedeId);

      await sql`
        UPDATE app_data SET value = ${JSON.stringify(filtered)}, updated_at = NOW() WHERE key = ${key}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[API Error]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}