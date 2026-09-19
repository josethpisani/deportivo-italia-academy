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

  // Trial requests table
  await sql`
    CREATE TABLE IF NOT EXISTS trial_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      representative_name TEXT NOT NULL,
      athlete_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      sede_id TEXT NOT NULL,
      preferred_date DATE NOT NULL,
      preferred_time_slot TEXT NOT NULL, -- '16:30' or '17:00'
      age_category TEXT NOT NULL, -- 'U4_U6' or 'U8_U12'
      status TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'confirmada', 'cancelada'
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Extend the original trial request schema without removing legacy columns.
  for (const statement of [
    sql`ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS athlete_age INTEGER`,
    sql`ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS category TEXT`,
    sql`ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS test_date DATE`,
    sql`ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS test_time TEXT`,
    sql`ALTER TABLE trial_requests ADD COLUMN IF NOT EXISTS registration_code TEXT`
  ]) {
    try { await statement; } catch (e) { console.warn("Trial schema extension skipped:", e.message); }
  }

  // Create indexes for trial_requests
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_trial_requests_sede_id ON trial_requests(sede_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trial_requests_date ON trial_requests(preferred_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trial_requests_status ON trial_requests(status)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_trial_requests_registration_code ON trial_requests(registration_code) WHERE registration_code IS NOT NULL`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_trial_requests_athlete_date_sede ON trial_requests (LOWER(TRIM(athlete_name)), sede_id, preferred_date)`;
  } catch (e) {
    // Index might already exist
  }

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
  if (data === null || data === undefined) return data;
  // Preserve object-shaped legacy data such as config.
  if (!Array.isArray(data)) return data;
  if (!sedeId) return data; // If no sede_id specified, return all (for superadmin)
  // Keep legacy rows without sede_id visible until an explicit migration is approved.
  return data.filter(item => !item.sede_id || item.sede_id === sedeId);
}

async function updateSedeRecord(sql, id, updates = {}) {
  const setters = {
    nombre: value => sql`UPDATE sedes SET nombre = ${value}, updated_at = NOW() WHERE id = ${id}`,
    codigo: value => sql`UPDATE sedes SET codigo = ${value}, updated_at = NOW() WHERE id = ${id}`,
    estado: value => sql`UPDATE sedes SET estado = ${value}, updated_at = NOW() WHERE id = ${id}`,
    direccion: value => sql`UPDATE sedes SET direccion = ${value}, updated_at = NOW() WHERE id = ${id}`,
    telefono: value => sql`UPDATE sedes SET telefono = ${value}, updated_at = NOW() WHERE id = ${id}`,
    email: value => sql`UPDATE sedes SET email = ${value}, updated_at = NOW() WHERE id = ${id}`,
    logo: value => sql`UPDATE sedes SET logo = ${value}, updated_at = NOW() WHERE id = ${id}`,
    imagen_principal: value => sql`UPDATE sedes SET imagen_principal = ${value}, updated_at = NOW() WHERE id = ${id}`,
    descripcion: value => sql`UPDATE sedes SET descripcion = ${value}, updated_at = NOW() WHERE id = ${id}`
  };
  for (const [field, value] of Object.entries(updates)) {
    if (setters[field]) await setters[field](value);
  }
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

      // Special endpoint: get trial requests
      if (key === "trial_requests") {
        if (!sede_id) return res.status(400).json({ error: "sede_id is required" });
        const { status, date_from, date_to } = req.query;
        const rows = await sql`
          SELECT * FROM trial_requests
          WHERE sede_id = ${sede_id}
            AND (CAST(${status || null} AS TEXT) IS NULL OR status = ${status || null})
            AND (CAST(${date_from || null} AS DATE) IS NULL OR preferred_date >= CAST(${date_from || null} AS DATE))
            AND (CAST(${date_to || null} AS DATE) IS NULL OR preferred_date <= CAST(${date_to || null} AS DATE))
          ORDER BY preferred_date ASC, preferred_time_slot ASC, created_at DESC
        `;
        return res.status(200).json(rows);
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
        
        await updateSedeRecord(sql, id, updates);
        return res.status(200).json({ success: true });
      }

      // For trial_requests
      if (key === "trial_requests") {
        const { representative_name, athlete_name, athlete_age, category, email, phone, sede_id: bodySedeId, preferred_date, test_date, preferred_time_slot, test_time, age_category, notes } = value;
        const targetSedeId = bodySedeId || sede_id;
        const requestedDate = test_date || preferred_date;
        const normalizedCategory = String(category || "").toUpperCase();
        const categoryTimes = { U4: "16:30", U6: "16:30", U8: "17:00", U10: "17:00", U12: "17:00" };
        const requestedTime = test_time || preferred_time_slot || categoryTimes[normalizedCategory];
        
        if (!representative_name || !athlete_name || !targetSedeId || !requestedDate || !normalizedCategory || !requestedTime || athlete_age === undefined || athlete_age === null || !email || !phone) {
          return res.status(400).json({ error: "Missing required fields for trial request" });
        }

        if (!Object.prototype.hasOwnProperty.call(categoryTimes, normalizedCategory)) {
          return res.status(400).json({ error: "Categoría inválida. Use U4, U6, U8, U10 o U12" });
        }
        if (Number(athlete_age) < 3 || Number(athlete_age) > 12 || !Number.isInteger(Number(athlete_age))) {
          return res.status(400).json({ error: "La edad debe ser un número entero entre 3 y 12" });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || !/^\d{2}:\d{2}$/.test(requestedTime)) {
          return res.status(400).json({ error: "Fecha u horario inválido" });
        }
        if (!/^(?:\+?507[\s-]?)?[2-9]\d{3}[\s-]?\d{4}$/.test(String(phone).trim())) {
          return res.status(400).json({ error: "Teléfono inválido para Panamá" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
          return res.status(400).json({ error: "Correo electrónico inválido" });
        }
        if (requestedTime !== categoryTimes[normalizedCategory]) {
          return res.status(400).json({ error: `El horario de ${normalizedCategory} debe ser ${categoryTimes[normalizedCategory]}` });
        }
        
        // Validate date is Monday (1) or Wednesday (3)
        const date = new Date(`${requestedDate}T12:00:00Z`);
        const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, 3 = Wednesday
        if (dayOfWeek !== 1 && dayOfWeek !== 3) {
          return res.status(400).json({ error: "Las pruebas solo están disponibles los lunes y miércoles" });
        }
        
        const duplicate = await sql`SELECT registration_code FROM trial_requests WHERE LOWER(TRIM(athlete_name)) = LOWER(TRIM(${athlete_name})) AND sede_id = ${targetSedeId} AND preferred_date = ${requestedDate} LIMIT 1`;
        if (duplicate.length) return res.status(409).json({ error: "Ya existe una práctica de prueba para este atleta en esa fecha y sede", registration_code: duplicate[0].registration_code });
        const registrationCode = `PRUEBA-${requestedDate.slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`;
        
        await sql`
          INSERT INTO trial_requests (representative_name, athlete_name, athlete_age, category, email, phone, sede_id, preferred_date, preferred_time_slot, test_date, test_time, age_category, registration_code, notes, created_at, updated_at)
          VALUES (${representative_name}, ${athlete_name}, ${Number(athlete_age)}, ${normalizedCategory}, ${email}, ${phone}, ${targetSedeId}, ${requestedDate}, ${requestedTime}, ${requestedDate}, ${requestedTime}, ${normalizedCategory}, ${registrationCode}, ${notes || ''}, NOW(), NOW())
        `;
        
        return res.status(201).json({ success: true, registration_code: registrationCode, request: { ...value, athlete_age: Number(athlete_age), category: normalizedCategory, test_date: requestedDate, test_time: requestedTime, registration_code: registrationCode, status: "pendiente" } });
      }

      // Site content is global; operational data is isolated by sede.
      if (key === "siteContent") {
        await sql`
          INSERT INTO app_data (key, value, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `;
        return res.status(200).json({ success: true });
      }

      if (key === "config") {
        await sql`
          INSERT INTO app_data (key, value, sede_id, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}, ${targetSedeId || null}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, sede_id = EXCLUDED.sede_id, updated_at = NOW()
        `;
        return res.status(200).json({ success: true });
      }

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

      if (key === "trial_requests") {
        const editableFields = ["status", "notes", "representative_name", "athlete_name", "athlete_age", "category", "email", "phone", "preferred_date", "preferred_time_slot", "test_date", "test_time"];
        if (!targetSedeId || !itemId || !updates || !Object.keys(updates).some(field => editableFields.includes(field))) {
          return res.status(400).json({ error: "Missing itemId or valid updates" });
        }
        if (updates.status !== undefined && !["pendiente", "confirmada", "realizada", "no_asistio", "cancelada"].includes(updates.status)) {
          return res.status(400).json({ error: "Invalid trial request status" });
        }
        const current = await sql`SELECT * FROM trial_requests WHERE id = ${itemId} AND sede_id = ${targetSedeId} LIMIT 1`;
        if (!current.length) return res.status(404).json({ error: "Trial request not found" });
        const next = { ...current[0], ...updates };
        const category = String(next.category || '').toUpperCase();
        const testDate = next.test_date || next.preferred_date;
        const testTime = next.test_time || next.preferred_time_slot;
        if (updates.category !== undefined && !["U4", "U6", "U8", "U10", "U12"].includes(category)) {
          return res.status(400).json({ error: "Categoría inválida" });
        }
        if (updates.athlete_age !== undefined && (!Number.isInteger(Number(next.athlete_age)) || Number(next.athlete_age) < 3 || Number(next.athlete_age) > 12)) {
          return res.status(400).json({ error: "La edad debe estar entre 3 y 12 años" });
        }
        if (updates.test_date !== undefined || updates.preferred_date !== undefined) {
          const weekday = new Date(`${testDate}T12:00:00`).getDay();
          if (![1, 3].includes(weekday)) return res.status(400).json({ error: "Las pruebas solo están disponibles los lunes y miércoles" });
        }
        if (updates.test_time !== undefined || updates.preferred_time_slot !== undefined) {
          if (!["16:30", "17:00"].includes(testTime)) return res.status(400).json({ error: "Horario inválido" });
        }
        await sql`UPDATE trial_requests SET
          representative_name = ${next.representative_name}, athlete_name = ${next.athlete_name}, athlete_age = ${next.athlete_age ? Number(next.athlete_age) : null},
          category = ${category || null}, email = ${next.email}, phone = ${next.phone}, preferred_date = ${testDate}, preferred_time_slot = ${testTime},
          test_date = ${testDate}, test_time = ${testTime}, age_category = ${category || next.age_category || null}, status = ${next.status}, notes = ${next.notes || ''}, updated_at = NOW()
          WHERE id = ${itemId} AND sede_id = ${targetSedeId}`;
        return res.status(200).json({ success: true });
      }

      if (key === "sede") {
        const { id, ...updatesForSede } = updates || {};
        const sedeId = id || itemId;
        if (!sedeId) return res.status(400).json({ error: "Missing sede id" });
        if (Object.keys(updatesForSede).length === 0) return res.status(400).json({ error: "No valid sede fields to update" });
        await updateSedeRecord(sql, sedeId, updatesForSede);
        return res.status(200).json({ success: true });
      }
      
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
      
      if (!key || (!targetSedeId && key !== "sedes" && key !== "trial_requests")) {
        return res.status(400).json({ error: "Missing key or sede_id" });
      }

      // Delete trial_requests
      if (key === "trial_requests" && itemId) {
        if (!targetSedeId) return res.status(400).json({ error: "sede_id is required" });
        await sql`DELETE FROM trial_requests WHERE id = ${itemId} AND sede_id = ${targetSedeId}`;
        return res.status(200).json({ success: true });
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
