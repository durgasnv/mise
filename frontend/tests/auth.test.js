import test from "node:test";
import assert from "node:assert/strict";
import { getGenerationAuthorization, signOutChef } from "../src/lib/auth.js";
import { generateRecipeApi } from "../src/lib/api.js";

async function withSession(user, sdk, run) {
  const previous = { window: globalThis.window, localStorage: globalThis.localStorage, fetch: globalThis.fetch };
  let profile = user ? JSON.stringify(user) : null;
  globalThis.localStorage = {
    getItem: () => profile,
    removeItem: () => { profile = null; },
  };
  globalThis.window = { puter: sdk, dispatchEvent() {} };
  try { await run(); } finally { Object.assign(globalThis, previous); }
}

test("local demo or forged profile cannot authorize generation without a live SDK token", async () => {
  for (const [user, sdk] of [[null, {}], [{ provider: "demo" }, { authToken: "old-real-token" }], [{ provider: "puter" }, {}]]) {
    await withSession(user, sdk, async () => {
      globalThis.fetch = async () => assert.fail("must not call generation");
      assert.throws(() => getGenerationAuthorization(), (error) => error.code === "AUTH_REQUIRED");
      await assert.rejects(generateRecipeApi("corn"), (error) => error.code === "AUTH_REQUIRED");
    });
  }
});

test("reads refreshed SDK credentials on every request without storing another token", async () => {
  const sdk = { authToken: "first" };
  await withSession({ provider: "puter" }, sdk, async () => {
    assert.equal(getGenerationAuthorization().Authorization, "Bearer first");
    sdk.authToken = "refreshed";
    assert.equal(getGenerationAuthorization().Authorization, "Bearer refreshed");
  });
});

test("backend authentication error code survives for the sign-in action", async () => {
  await withSession({ provider: "puter" }, { authToken: "expired" }, async () => {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ code: "AUTH_REQUIRED", error: "Sign in again." }) });
    await assert.rejects(generateRecipeApi("corn"), (error) => error.code === "AUTH_REQUIRED" && error.message === "Sign in again.");
  });
});

test("sign-out clears the profile even though SDK signOut returns synchronously", async () => {
  // CustomEvent is a browser API; model only its constructor for this storage regression.
  const originalEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };
  try {
    const sdk = { authToken: "live", auth: { signOut() { sdk.authToken = null; } } };
    await withSession({ provider: "puter" }, sdk, async () => {
      await signOutChef();
      assert.equal(sdk.authToken, null);
      assert.throws(() => getGenerationAuthorization(), (error) => error.code === "AUTH_REQUIRED");
    });
  } finally { globalThis.CustomEvent = originalEvent; }
});
