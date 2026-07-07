// api/data.js — Vercel Serverless Function + Neon PostgreSQL
// Handles all read/write for the Deportivo Italia Academy app

import { neon } from "@neondatabase/serverless";

async function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set. Check your environment variables.");
  }
  const sql = neon(process.env.DATABASE_URL);

  // Create table on first run (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS app_data (
      key         TEXT PRIMARY KEY,
      value       JSONB        NOT NULL,
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export default async function handler(req, res) {
  // CORS — allow the frontend origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const sql = await getDb();

    // ── GET ── return one key or all keys
    if (req.method === "GET") {
      const { key } = req.query;
      if (key) {
        const rows = await sql`SELECT value FROM app_data WHERE key = ${key}`;
        return res.status(200).json(rows[0]?.value ?? null);
      }
      // Return all as { key: value, ... }
      const rows = await sql`SELECT key, value FROM app_data`;
      const out = {};
      rows.forEach((r) => (out[r.key] = r.value));
      return res.status(200).json(out);
    }

    // ── POST ── upsert one key
    if (req.method === "POST") {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Missing key or value" });
      }
      await sql`
        INSERT INTO app_data (key, value, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      return res.status(200).json({ success: true });
    }

    // ── DELETE ── remove a key (optional utility)
    if (req.method === "DELETE") {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: "Missing key" });
      await sql`DELETE FROM app_data WHERE key = ${key}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[API Error]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
