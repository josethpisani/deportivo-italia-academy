import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { createHmac } from "node:crypto";
import { createWebhookHandler } from "../api/instagram-webhook.js";

const env = { INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "test-verification", META_APP_SECRET: "test-secret", DATABASE_URL: "test-db" };
async function request(method, url, body = "", { secret = env.META_APP_SECRET, persist = async () => {}, settings = env } = {}) {
  const req = Readable.from([Buffer.from(body)]);
  Object.assign(req, { method, url, headers: { "x-hub-signature-256": `sha256=${createHmac("sha256", secret).update(body).digest("hex")}` } });
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, send(value) { this.body = value; return this; } };
  await createWebhookHandler({ env: settings, persist })(req, res);
  return res;
}
test("verification echoes the exact challenge only for the configured token", async () => {
  const good = await request("GET", "/api/instagram-webhook?hub.mode=subscribe&hub.verify_token=test-verification&hub.challenge=123456");
  assert.equal(good.code, 200);
  assert.equal(good.body, "123456");
  assert.equal((await request("GET", "/?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123")).code, 403);
});
test("authenticated Instagram events are persisted before acknowledgment", async () => {
  const body = JSON.stringify({ object: "instagram", entry: [{ id: "academy", changes: [] }] });
  let stored;
  assert.equal((await request("POST", "/", body, { persist: async value => { stored = value.toString(); } })).code, 200);
  assert.equal(stored, body);
  assert.equal((await request("POST", "/", body, { secret: "wrong", persist: async () => { throw Error("must not persist"); } })).code, 401);
  assert.equal((await request("POST", "/", body, { persist: async () => { throw Error("db unavailable"); } })).code, 500);
});
test("rejects malformed, oversized and unconfigured deliveries", async () => {
  assert.equal((await request("POST", "/", "{")).code, 400);
  assert.equal((await request("POST", "/", "{}" )).code, 400);
  assert.equal((await request("POST", "/", "x".repeat(1024 * 1024 + 1))).code, 413);
  assert.equal((await request("POST", "/", "{}", { settings: {} })).code, 503);
  assert.equal((await request("DELETE", "/")).code, 405);
});
