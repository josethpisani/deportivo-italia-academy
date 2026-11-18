import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export const config = { api: { bodyParser: false } };
const maxBodyBytes = 1024 * 1024;

function equal(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function validSignature(body, signature, secret) {
  if (!secret || typeof signature !== "string" || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return equal(expected, signature.toLowerCase());
}

async function saveEvent(body) {
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS instagram_webhook_events (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const id = createHash("sha256").update(body).digest("hex");
  await sql`INSERT INTO instagram_webhook_events (id, payload)
    VALUES (${id}, ${body.toString("utf8")}::jsonb)
    ON CONFLICT (id) DO NOTHING`;
}

export function createWebhookHandler({ env = process.env, persist = saveEvent } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "GET") {
      const query = new URL(req.url, "https://localhost").searchParams;
      const token = env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
      if (!token) return res.status(503).send("Verification not configured");
      if (query.get("hub.mode") !== "subscribe" || !equal(query.get("hub.verify_token") || "", token)) {
        return res.status(403).send("Verification failed");
      }
      const challenge = query.get("hub.challenge");
      if (!challenge || challenge.length > 4096) return res.status(400).send("Invalid challenge");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(challenge);
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).send("Method not allowed");
    }
    if (!env.META_APP_SECRET || !env.DATABASE_URL) return res.status(503).send("Event receiver not configured");
    try {
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        const buffer = Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > maxBodyBytes) return res.status(413).send("Payload too large");
        chunks.push(buffer);
      }
      const body = Buffer.concat(chunks);
      if (!validSignature(body, req.headers["x-hub-signature-256"], env.META_APP_SECRET)) {
        return res.status(401).send("Invalid signature");
      }
      let event;
      try { event = JSON.parse(body.toString("utf8")); }
      catch { return res.status(400).send("Invalid JSON"); }
      if (event?.object !== "instagram" || !Array.isArray(event.entry)) {
        return res.status(400).send("Invalid Instagram event");
      }
      await persist(body);
      return res.status(200).send("EVENT_RECEIVED");
    } catch {
      // Return an error so Meta retries; never acknowledge an event before storage.
      return res.status(500).send("Unable to store event");
    }
  };
}

export default createWebhookHandler();
