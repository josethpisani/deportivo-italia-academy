// api/data.js — Vercel Serverless Function + Neon PostgreSQL
// Multi-branch support for Deportivo Italia Academy

import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashToken(token) { return createHash("sha256").update(token).digest("hex"); }
function hashPassword(password, salt = randomBytes(16).toString("hex")) { return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`; }
function createActivationCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return `DIA-${Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("")}`;
}
function verifyPassword(password, stored) {
  const [, salt, expected] = String(stored || "").split("$");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
function readCookie(req, name) {
  const cookies = String(req.headers.cookie || "").split(";").map(v => v.trim());
  const found = cookies.find(v => v.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}
function setSessionCookie(res, token) { res.setHeader("Set-Cookie", `dia_parent_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`); }

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

  await sql`
    CREATE TABLE IF NOT EXISTS parent_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
      password_hash TEXT, status TEXT NOT NULL DEFAULT 'pendiente', activation_code_hash TEXT,
      activation_expires_at TIMESTAMPTZ, failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS parent_athletes (
      parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
      athlete_id TEXT NOT NULL, sede_id TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (parent_id, athlete_id, sede_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS parent_sessions (
      token_hash TEXT PRIMARY KEY, parent_id UUID NOT NULL REFERENCES parent_accounts(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS staff_sessions (
      token_hash TEXT PRIMARY KEY, sede_id TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    async function getParentSession() {
      const rawToken = readCookie(req, "dia_parent_session");
      if (!rawToken) return null;
      const rows = await sql`SELECT p.*, s.expires_at FROM parent_sessions s JOIN parent_accounts p ON p.id = s.parent_id WHERE s.token_hash = ${hashToken(rawToken)} AND s.expires_at > NOW() AND p.status = 'activo' LIMIT 1`;
      return rows[0] || null;
    }
    async function getStaffSession() {
      const rawToken = readCookie(req, "dia_staff_session");
      if (!rawToken) return null;
      const rows = await sql`SELECT * FROM staff_sessions WHERE token_hash = ${hashToken(rawToken)} AND expires_at > NOW() LIMIT 1`;
      return rows[0] || null;
    }

    async function getParentAthletes(parentId) {
      const links = await sql`SELECT athlete_id, sede_id FROM parent_athletes WHERE parent_id = ${parentId}`;
      const rows = await sql`SELECT value FROM app_data WHERE key = 'athletes'`;
      const allAthletes = Array.isArray(rows[0]?.value) ? rows[0].value : [];
      return links.map(link => {
        const athlete = allAthletes.find(item => String(item.id) === String(link.athlete_id) && (!item.sede_id || item.sede_id === link.sede_id));
        return athlete ? { ...athlete, sede_id: link.sede_id } : null;
      }).filter(Boolean).map(({ password_hash, ...safe }) => safe);
    }

    async function getParentPortalData(parentId) {
      const athletes = await getParentAthletes(parentId);
      const tournamentRows = await sql`SELECT value FROM app_data WHERE key = 'torneos'`;
      const allTorneos = Array.isArray(tournamentRows[0]?.value) ? tournamentRows[0].value : [];
      const torneoIds = new Set(athletes.flatMap(athlete => (Array.isArray(athlete.torneos) ? athlete.torneos : []).map(item => String(item.torneoId || item.id || ''))));
      const torneos = allTorneos.filter(torneo => torneoIds.has(String(torneo.id)));
      const siteRows = await sql`SELECT value FROM app_data WHERE key = 'siteContent'`;
      const siteContent = siteRows[0]?.value || {};
      const galeria = Array.isArray(siteContent.galeria)
        ? siteContent.galeria.filter(image => image && image.portal_visible !== false).map(({ url, descripcion, categoria, fecha }) => ({ url, descripcion: descripcion || '', categoria: categoria || 'General', fecha: fecha || '' }))
        : [];
      return { athletes, torneos, galeria };
    }

    if (req.method === "GET" && req.query.key === "portal_me") {
      const parent = await getParentSession();
      if (!parent) return res.status(401).json({ error: "Sesión no válida" });
      return res.status(200).json({ parent: { id: parent.id, email: parent.email, full_name: parent.full_name }, ...(await getParentPortalData(parent.id)) });
    }

    if (req.method === "GET" && req.query.key === "parent_admin") {
      if (!(await getStaffSession())) return res.status(401).json({ error: "Sesión STAFF requerida" });
      const accounts = await sql`SELECT id, email, full_name, status, last_login_at, created_at FROM parent_accounts ORDER BY created_at DESC`;
      const links = await sql`SELECT parent_id, athlete_id, sede_id FROM parent_athletes ORDER BY created_at`;
      return res.status(200).json(accounts.map(account => ({ ...account, links: links.filter(link => String(link.parent_id) === String(account.id)) })));
    }

    if (req.method === "POST" && req.body?.key === "portal") {
      const { action, email, password, activation_code, full_name } = req.body;
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (action === "login") {
        if (!normalizedEmail || !password) return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
        const rows = await sql`SELECT * FROM parent_accounts WHERE LOWER(email) = ${normalizedEmail} LIMIT 1`;
        const parent = rows[0];
        if (!parent || parent.status !== "activo") return res.status(401).json({ error: "La cuenta no está activa o no existe" });
        if (parent.locked_until && new Date(parent.locked_until) > new Date()) return res.status(429).json({ error: "Cuenta bloqueada temporalmente" });
        if (!verifyPassword(password, parent.password_hash)) {
          const attempts = Number(parent.failed_attempts || 0) + 1;
          if (attempts >= 5) await sql`UPDATE parent_accounts SET failed_attempts = ${attempts}, locked_until = NOW() + INTERVAL '15 minutes', updated_at = NOW() WHERE id = ${parent.id}`;
          else await sql`UPDATE parent_accounts SET failed_attempts = ${attempts}, updated_at = NOW() WHERE id = ${parent.id}`;
          return res.status(401).json({ error: "Correo o contraseña incorrectos" });
        }
        const token = randomBytes(32).toString("hex");
        await sql`INSERT INTO parent_sessions (token_hash, parent_id, expires_at) VALUES (${hashToken(token)}, ${parent.id}, NOW() + INTERVAL '7 days')`;
        await sql`UPDATE parent_accounts SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = ${parent.id}`;
        setSessionCookie(res, token);
        return res.status(200).json({ success: true, parent: { id: parent.id, email: parent.email, full_name: parent.full_name }, ...(await getParentPortalData(parent.id)) });
      }
      if (action === "activate") {
        if (!normalizedEmail || !activation_code || !password || !full_name) return res.status(400).json({ error: "Datos de activación incompletos" });
        const rows = await sql`SELECT * FROM parent_accounts WHERE LOWER(email) = ${normalizedEmail} AND status = 'pendiente' LIMIT 1`;
        const parent = rows[0];
        if (!parent || !parent.activation_code_hash || hashToken(String(activation_code).trim().toUpperCase()) !== parent.activation_code_hash) return res.status(401).json({ error: "Código de activación inválido o ya utilizado" });
        await sql`UPDATE parent_accounts SET full_name = ${String(full_name).trim()}, password_hash = ${hashPassword(password)}, status = 'activo', activation_code_hash = NULL, activation_expires_at = NULL, updated_at = NOW() WHERE id = ${parent.id}`;
        return res.status(200).json({ success: true, message: "Cuenta activada. Ya puedes iniciar sesión." });
      }
      if (action === "logout") {
        const rawToken = readCookie(req, "dia_parent_session");
        if (rawToken) await sql`DELETE FROM parent_sessions WHERE token_hash = ${hashToken(rawToken)}`;
        res.setHeader("Set-Cookie", "dia_parent_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: "Acción de portal inválida" });
    }

    if (req.method === "POST" && req.body?.key === "staff_auth") {
      const { action, email, password, sede_id: staffSedeId } = req.body;
      if (action === "login") {
        const valid = (staffSedeId === 'sed_brisas' && email === 'acceso br' && password === 'br12345') || (staffSedeId === 'sed_panama_viejo' && email === 'acceso pv' && password === 'pv12345');
        if (!valid) return res.status(401).json({ error: "Credenciales STAFF incorrectas" });
        const token = randomBytes(32).toString('hex');
        await sql`INSERT INTO staff_sessions (token_hash, sede_id, expires_at) VALUES (${hashToken(token)}, ${staffSedeId}, NOW() + INTERVAL '8 hours')`;
        res.setHeader("Set-Cookie", `dia_staff_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
        return res.status(200).json({ success: true });
      }
      if (action === "logout") {
        const token = readCookie(req, 'dia_staff_session');
        if (token) await sql`DELETE FROM staff_sessions WHERE token_hash = ${hashToken(token)}`;
        res.setHeader("Set-Cookie", "dia_staff_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: "Acción STAFF inválida" });
    }

    if (req.method === "POST" && req.body?.key === "registration_admin") {
      const staffSession = await getStaffSession();
      if (!staffSession) return res.status(401).json({ error: "Sesión STAFF requerida" });
      const { action, request_id, reason } = req.body;
      const stored = await sql`SELECT value FROM app_data WHERE key = 'registration_requests'`;
      const requests = Array.isArray(stored[0]?.value) ? stored[0].value : [];
      const requestIndex = requests.findIndex(item => String(item.id) === String(request_id) && item.sede_id === staffSession.sede_id);
      if (requestIndex < 0) return res.status(404).json({ error: "Solicitud no encontrada" });
      const request = requests[requestIndex];
      if (action === "decline") {
        requests[requestIndex] = { ...request, status: "declinada", decline_reason: String(reason || ""), updated_at: new Date().toISOString() };
        await sql`UPDATE app_data SET value = ${JSON.stringify(requests)}, updated_at = NOW() WHERE key = 'registration_requests'`;
        return res.status(200).json({ success: true, status: "declinada" });
      }
      if (action !== "accept") return res.status(400).json({ error: "Acción de inscripción inválida" });
      if (!["pendiente", "declinada"].includes(request.status)) return res.status(409).json({ error: "La solicitud ya fue procesada" });
      const athleteRows = await sql`SELECT value FROM app_data WHERE key = 'athletes'`;
      const athletes = Array.isArray(athleteRows[0]?.value) ? athleteRows[0].value : [];
      const existingAthlete = athletes.find(item => item.sede_id === staffSession.sede_id && String(item.registration_request_id || '') === String(request.id));
      if (existingAthlete) return res.status(409).json({ error: "La solicitud ya tiene un atleta creado" });
      const nameParts = String(request.athlete_name || "Jugador").trim().split(/\s+/);
      const athlete = {
        id: `ath_${randomBytes(8).toString('hex')}`, registration_request_id: request.id, sede_id: staffSession.sede_id,
        nombre: nameParts.shift() || "Jugador", apellido: nameParts.join(" ") || "Sin apellido", categoria: String(request.category || "U8").toUpperCase(), edad: Number(request.athlete_age),
        fechaNacimiento: "", posicion: "Por definir", representante: request.representative_name || "", telefono: request.phone || "", direccion: "", fechaIngreso: new Date().toISOString().slice(0, 10),
        matricula: { estado: "pendiente", monto: 0, fecha: new Date().toISOString().slice(0, 10) }, mensualidades: {}, torneos: [], asistenciaEntrenamiento: {}, asistenciaJuegos: {}, observaciones: request.notes || "", estadisticas: {}, statsGenerales: { goles: 0, asistencias: 0, tarjetasAmarillas: 0, tarjetasRojas: 0, partidosJugados: 0, entrenamientosAsistidos: 0, entrenamientosTotales: 0 }, evaluaciones: []
      };
      const otherSedeAthletes = athletes.filter(item => item.sede_id && item.sede_id !== staffSession.sede_id);
      const legacyAthletes = athletes.filter(item => !item.sede_id);
      await sql`INSERT INTO app_data (key, value, sede_id, updated_at) VALUES ('athletes', ${JSON.stringify([...otherSedeAthletes, ...legacyAthletes, athlete])}, ${staffSession.sede_id}, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, sede_id = EXCLUDED.sede_id, updated_at = NOW()`;
      const normalizedEmail = String(request.email || "").trim().toLowerCase();
      let parent = (await sql`SELECT id, status FROM parent_accounts WHERE LOWER(email) = ${normalizedEmail} LIMIT 1`)[0];
      let activationCode = null;
      if (!parent) {
        activationCode = createActivationCode();
        parent = (await sql`INSERT INTO parent_accounts (email, full_name, status, activation_code_hash, activation_expires_at) VALUES (${normalizedEmail}, ${request.representative_name || "Representante"}, 'pendiente', ${hashToken(activationCode)}, NULL) RETURNING id, status`)[0];
      }
      await sql`INSERT INTO parent_athletes (parent_id, athlete_id, sede_id) VALUES (${parent.id}, ${athlete.id}, ${staffSession.sede_id}) ON CONFLICT DO NOTHING`;
      requests[requestIndex] = { ...request, status: "aceptada", athlete_id: athlete.id, parent_id: parent.id, updated_at: new Date().toISOString() };
      await sql`UPDATE app_data SET value = ${JSON.stringify(requests)}, updated_at = NOW() WHERE key = 'registration_requests'`;
      return res.status(200).json({ success: true, status: "aceptada", athlete_id: athlete.id, activation_code: activationCode });
    }

    if (req.method === "POST" && req.body?.key === "parent_admin") {
      if (!(await getStaffSession())) return res.status(401).json({ error: "Sesión STAFF requerida" });
      const { action, id, email, full_name, athlete_id, sede_id: linkSedeId } = req.body;
      if (action === "create") {
        const normalizedEmail = String(email || "").trim().toLowerCase();
        if (!normalizedEmail || !full_name) return res.status(400).json({ error: "Nombre y correo son obligatorios" });
        const code = createActivationCode();
        const existing = await sql`SELECT id FROM parent_accounts WHERE LOWER(email) = ${normalizedEmail} LIMIT 1`;
        if (existing.length) return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
        const created = await sql`INSERT INTO parent_accounts (email, full_name, status, activation_code_hash, activation_expires_at) VALUES (${normalizedEmail}, ${String(full_name).trim()}, 'pendiente', ${hashToken(code)}, NULL) RETURNING id, email, full_name, status, created_at`;
        return res.status(201).json({ success: true, account: created[0], activation_code: code });
      }
      if (action === "link") {
        if (!id || !athlete_id || !linkSedeId) return res.status(400).json({ error: "Representante, atleta y sede son obligatorios" });
        await sql`INSERT INTO parent_athletes (parent_id, athlete_id, sede_id) VALUES (${id}, ${athlete_id}, ${linkSedeId}) ON CONFLICT DO NOTHING`;
        return res.status(200).json({ success: true });
      }
      if (action === "unlink") {
        await sql`DELETE FROM parent_athletes WHERE parent_id = ${id} AND athlete_id = ${athlete_id} AND sede_id = ${linkSedeId}`;
        return res.status(200).json({ success: true });
      }
      if (action === "status") {
        if (!["activo", "pendiente", "desactivado"].includes(req.body.status)) return res.status(400).json({ error: "Estado inválido" });
        await sql`UPDATE parent_accounts SET status = ${req.body.status}, updated_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ success: true });
      }
      if (action === "regenerate_code") {
        const code = createActivationCode();
        await sql`UPDATE parent_accounts SET status = 'pendiente', activation_code_hash = ${hashToken(code)}, activation_expires_at = NULL, updated_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ success: true, activation_code: code });
      }
      return res.status(400).json({ error: "Acción administrativa inválida" });
    }

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
