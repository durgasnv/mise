import { dinner } from "../../shared/recipe-fixture.js";
import { DEFAULT_CONSTRAINTS } from "../../shared/pantry.js";
import test from "node:test";
import assert from "node:assert/strict";
import { generateRecipeApi } from "../src/lib/api.js";

async function withFetch(fetchImpl, run) {
  const original = globalThis.fetch;
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  globalThis.window = { puter: { authToken: "test-puter-token" } };
  globalThis.localStorage = { getItem: () => JSON.stringify({ id: "test-user", provider: "puter" }) };
  globalThis.fetch = fetchImpl;
  try { await run(); } finally { globalThis.fetch = original; globalThis.window = originalWindow; globalThis.localStorage = originalStorage; }
}

test("returns validated structured recipes and supplies a cancellation signal", async () => {
  await withFetch(async (url, options) => {
    assert.equal(url, "/api/generate-recipe");
    assert.equal(options.headers.Authorization, "Bearer test-puter-token");
    assert.deepEqual(JSON.parse(options.body), { question: "corn", image: null });
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, json: async () => ({ recipes: [dinner], constraints: DEFAULT_CONSTRAINTS, accountId: "puter:test-user" }) };
  }, async () => assert.deepEqual((await generateRecipeApi("corn"))[0].structured, dinner));
});

test("preserves actionable photo and quota errors instead of returning fallback recipes", async () => {
  for (const message of ["Photo scanning is unavailable. Enter ingredients.", "The kitchen is busy. Please wait a minute."]) {
    await withFetch(async () => ({ ok: false, status: 503, json: async () => ({ error: message }) }),
      async () => assert.rejects(generateRecipeApi("corn"), (error) => error.message === message));
  }
});

test("rejects empty and incorrectly typed recipe payloads", async () => {
  for (const response of [null, {}, { response: " " }, { response: {} }]) {
    await withFetch(async () => ({ ok: true, json: async () => response }),
      async () => assert.rejects(generateRecipeApi("corn"), /No recipe response/));
  }
});

test("abort failures are actionable and unexpected error pages are handled", async () => {
  await withFetch(async () => { const error = new Error("aborted"); error.name = "AbortError"; throw error; },
    async () => assert.rejects(generateRecipeApi("corn"), /took too long/));
  await withFetch(async () => ({ ok: false, json: async () => { throw new Error("HTML error page"); } }),
    async () => assert.rejects(generateRecipeApi("corn"), /Please try again/));
});

test('rejects unvalidated structured data and account mismatches', async () => {
  for (const payload of [{ recipes: [{}], constraints: DEFAULT_CONSTRAINTS, accountId: 'puter:test-user' }, { recipes: [dinner], constraints: DEFAULT_CONSTRAINTS, accountId: 'puter:another-user' }]) {
    await withFetch(async () => ({ ok: true, json: async () => payload }), async () => assert.rejects(generateRecipeApi('corn')));
  }
});
