import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/auth.js";
import { legacyAuthEnabled, legacyAuthSecret } from "../lib/legacy-auth-config.js";

function responseStub() {
  return {
    statusCode: 200, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; },
    end() {},
  };
}

async function withConfig(config, run) {
  const original = Object.fromEntries(Object.keys(config).map((key) => [key, process.env[key]]));
  Object.assign(process.env, config);
  try { await run(); } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

test("public demo login never issues an API token", async () => {
  const res = responseStub();
  await handler({ method: "POST", url: "/api/auth/demo-login", headers: { host: "localhost" }, body: {} }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.payload.token, undefined);
});

test("legacy password auth is disabled unless explicitly enabled", async () => {
  await withConfig({ ENABLE_LEGACY_AUTH: "false" }, async () => {
    const res = responseStub();
    await handler({ method: "POST", url: "/api/auth/register", headers: { host: "localhost" }, body: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.token, undefined);
    assert.equal(res.headers["Cache-Control"], "no-store");
  });
});

test("known JWT secret is rejected even when legacy routes are enabled", async () => {
  await withConfig({ ENABLE_LEGACY_AUTH: "true", JWT_SECRET: "mise_secret_chef_jwt_key_2026" }, async () => {
    const res = responseStub();
    await handler({ method: "POST", url: "/api/auth/login", headers: { host: "localhost" }, body: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.token, undefined);
  });
});

test("legacy auth has no usable default secret and requires explicit enablement", () => {
  assert.equal(legacyAuthEnabled({}), false);
  assert.equal(legacyAuthEnabled({ ENABLE_LEGACY_AUTH: "true" }), true);
  for (const JWT_SECRET of [undefined, "short", "mise_secret_chef_jwt_key_2026", "replace_with_a_long_random_secret"]) {
    assert.equal(legacyAuthSecret({ JWT_SECRET }), null);
  }
  assert.equal(legacyAuthSecret({ JWT_SECRET: "a-unique-long-secret-value-for-this-test-123" }), "a-unique-long-secret-value-for-this-test-123");
});
