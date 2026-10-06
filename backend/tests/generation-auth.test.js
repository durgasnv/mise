import test from "node:test";
import assert from "node:assert/strict";
import { authenticateGeneration } from "../lib/generation-auth.js";

const request = (...values) => ({ headers: { authorization: values.length ? values[0] : "Bearer sdk-token" }, body: { userId: "pretend-user", provider: "demo" } });

test("requires a bounded Bearer token without trusting browser identity", async () => {
  for (const value of [undefined, "", "Basic abc", ["Bearer abc"], "Bearer abc def", `Bearer ${"a".repeat(8192)}`]) {
    await assert.rejects(authenticateGeneration(request(value), { fetchImpl: async () => assert.fail("must not contact provider") }), (error) => error.status === 401);
  }
});

test("derives identity only from the fixed Puter endpoint", async () => {
  const user = await authenticateGeneration(request(), { fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.puter.com/whoami");
    assert.equal(options.headers.Authorization, "Bearer sdk-token");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, status: 200, json: async () => ({ uuid: "real-user", username: "Chef", email: "private@example.com" }) };
  } });
  assert.deepEqual(user, { id: "puter:real-user", provider: "puter" });
});

test("invalid or revoked credentials are rejected", async () => {
  for (const status of [401, 403]) {
    await assert.rejects(authenticateGeneration(request(), { fetchImpl: async () => ({ ok: false, status }) }), (error) => error.status === 401);
  }
});

test("temporary accounts cannot generate recipes", async () => {
  await assert.rejects(authenticateGeneration(request(), { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ uuid: "temp-user", is_temp: true }) }) }),
    (error) => error.status === 403 && error.code === "ACCOUNT_REQUIRED");
});

test("provider outages and malformed identities fail closed without leaking tokens", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("secret sdk-token"); },
    async () => ({ ok: false, status: 500 }),
    async () => ({ ok: true, json: async () => ({ uuid: "" }) }),
    async () => ({ ok: true, json: async () => ({ uuid: {} }) }),
  ]) {
    await assert.rejects(authenticateGeneration(request(), { fetchImpl }), (error) => error.status === 503 && !error.message.includes("sdk-token"));
  }
});

