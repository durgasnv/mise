import test from "node:test";
import assert from "node:assert/strict";
import { callGroq, createGenerationHandler } from "../api/generate-recipe.js";
import { validateGenerationBody, createGenerationLimiter, MAX_IMAGE_BYTES } from "../lib/generation-guards.js";

const photo = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64")}`;
const env = { GROQ_API_KEY: "test-key", GROQ_VISION_MODEL: "test-vision" };
const result = (content, finish_reason = "stop") => ({ ok: true, json: async () => ({ choices: [{ message: { content }, finish_reason }] }) });

test("rejects invalid types, empty inputs, oversized lists and non-image payloads", () => {
  for (const body of [null, [], {}, "{broken", { question: 2 }, { image: {} }, { question: " " }, { image: "https://example.com/photo.jpg" }, { image: "data:image/jpeg;base64,dGVzdA==" }]) {
    assert.throws(() => validateGenerationBody(body), (error) => error.status === 400);
  }
  assert.throws(() => validateGenerationBody({ question: "a".repeat(6001) }), (error) => error.status === 413);
  assert.throws(() => validateGenerationBody({ image: `data:image/jpeg;base64,${Buffer.alloc(MAX_IMAGE_BYTES + 1, 0xff).toString("base64")}` }), (error) => error.status === 413);
  assert.deepEqual(validateGenerationBody(JSON.stringify({ question: " corn " })), { question: "corn", imageBase64: null });
  assert.deepEqual(validateGenerationBody({ image: photo }), { question: "", imageBase64: photo });
});

test("bounds local admission and resets after its window", () => {
  let clock = 0;
  const admit = createGenerationLimiter({ limit: 2, windowMs: 1000, now: () => clock });
  assert.equal(admit().allowed, true);
  assert.equal(admit().allowed, true);
  assert.deepEqual(admit(), { allowed: false, retryAfter: 1 });
  clock = 1000;
  assert.equal(admit().allowed, true);
});

test("uses a supported default text model and a bounded completion", async () => {
  let request;
  const text = await callGroq({ question: "corn" }, {
    env, fetchImpl: async (_url, options) => {
      assert.equal(options.headers.Authorization, "Bearer test-key");
      request = JSON.parse(options.body);
      return result("recipe");
    },
  });
  assert.equal(text, "recipe");
  assert.equal(request.model, "openai/gpt-oss-20b");
  assert.equal(request.max_completion_tokens, 4096);
});

test("honors configured model IDs and retains the image", async () => {
  for (const input of [{ question: "corn" }, { question: "identify this", imageBase64: photo }]) {
    let request;
    await callGroq(input, {
      env: { ...env, GROQ_TEXT_MODEL: "test-text" },
      fetchImpl: async (_url, options) => { request = JSON.parse(options.body); return result("recipe"); },
    });
    assert.equal(request.model, input.imageBase64 ? "test-vision" : "test-text");
    if (input.imageBase64) assert.equal(request.messages[1].content[1].image_url.url, photo);
  }
});

test("missing vision configuration makes no provider call", async () => {
  let calls = 0;
  await assert.rejects(callGroq({ imageBase64: photo }, {
    env: { GROQ_API_KEY: "test" }, fetchImpl: async () => { calls++; },
  }), (error) => error.status === 503 && error.code === "VISION_UNAVAILABLE");
  assert.equal(calls, 0);
});

test("vision rejection never silently retries as text or exposes provider details", async () => {
  let calls = 0;
  await assert.rejects(callGroq({ question: "identify ingredients", imageBase64: photo }, {
    env, fetchImpl: async () => {
      calls++;
      return { ok: false, status: 400, json: async () => ({ error: { message: "private-provider-detail" } }) };
    },
  }), (error) => error.code === "VISION_FAILED" && !error.message.includes("private-provider-detail"));
  assert.equal(calls, 1);
});

test("rejects empty and truncated provider results", async () => {
  for (const response of [result(""), result("half a recipe", "length")]) {
    await assert.rejects(callGroq({ question: "corn" }, { env, fetchImpl: async () => response }), (error) => error.code === "INCOMPLETE_RESPONSE");
  }
});

test("maps timeouts, network errors and missing credentials to actionable errors", async () => {
  await assert.rejects(callGroq({ question: "corn" }, { env: {} }), (error) => error.status === 503);
  for (const [name, code] of [["AbortError", "GENERATION_TIMEOUT"], ["TypeError", "GENERATION_FAILED"]]) {
    await assert.rejects(callGroq({ question: "corn" }, {
      env, fetchImpl: async () => { const error = new Error("private details"); error.name = name; throw error; },
    }), (error) => error.code === code && !error.message.includes("private details"));
  }
});

function responseStub() {
  return {
    headers: {}, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    end() { return this; },
  };
}

test("handler rejects invalid inputs and exhausted admission before generation", async () => {
  let calls = 0;
  const handler = createGenerationHandler({ authenticate: async () => ({ id: "puter:test-user", provider: "puter" }), reserveQuota: async () => {}, generate: async () => { calls++; }, admit: () => ({ allowed: false, retryAfter: 12 }) });
  const bad = responseStub();
  await handler({ method: "POST", body: { question: 7 } }, bad);
  assert.equal(bad.statusCode, 400);
  const busy = responseStub();
  await handler({ method: "POST", body: { question: "corn" } }, busy);
  assert.equal(busy.statusCode, 429);
  assert.equal(busy.headers["Retry-After"], "12");
  assert.equal(calls, 0);
});

test("handler preserves success when optional history fails", async () => {
  const handler = createGenerationHandler({ authenticate: async () => ({ id: "puter:test-user", provider: "puter" }), reserveQuota: async () => {},
    generate: async () => "real recipe", admit: () => ({ allowed: true }), save: async () => { throw new Error("db offline"); },
  });
  const res = responseStub();
  await handler({ method: "POST", body: { question: "corn" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { response: "real recipe" });
});

test("handler propagates photo failures and hides unexpected internal errors", async () => {
  const { GenerationError } = await import("../lib/generation-guards.js");
  for (const [failure, expectedCode] of [
    [new GenerationError(502, "VISION_FAILED", "Remove the photo and enter ingredients."), "VISION_FAILED"],
    [new Error("private database credentials"), "INTERNAL_ERROR"],
  ]) {
    const handler = createGenerationHandler({ authenticate: async () => ({ id: "puter:test-user", provider: "puter" }), reserveQuota: async () => {},
      generate: async () => { throw failure; }, admit: () => ({ allowed: true }),
      save: async () => assert.fail("Failures must not be saved as recipes"),
    });
    const res = responseStub();
    await handler({ method: "POST", body: { image: photo } }, res);
    assert.equal(res.payload.code, expectedCode);
    assert.equal("response" in res.payload, false);
    assert.equal(res.payload.error.includes("credentials"), false);
  }
});

test("preflight and unsupported methods do not generate recipes", async () => {
  let calls = 0;
  const handler = createGenerationHandler({ authenticate: async () => ({ id: "puter:test-user", provider: "puter" }), reserveQuota: async () => {}, generate: async () => { calls++; } });
  for (const [method, status] of [["OPTIONS", 204], ["GET", 405]]) {
    const res = responseStub();
    await handler({ method }, res);
    assert.equal(res.statusCode, status);
  }
  assert.equal(calls, 0);
});

test("authentication and quota failures prevent provider calls", async () => {
  const { GenerationError } = await import("../lib/generation-guards.js");
  for (const gate of ["authentication", "quota"]) {
    let generated = false;
    let reserved = false;
    const handler = createGenerationHandler({
      admit: () => ({ allowed: true }),
      authenticate: async () => {
        if (gate === "authentication") throw new GenerationError(401, "AUTH_REQUIRED", "Sign in.");
        return { id: "puter:real-user", provider: "puter" };
      },
      reserveQuota: async (identity) => {
        reserved = true;
        assert.equal(identity.id, "puter:real-user");
        const error = new GenerationError(429, "USER_QUOTA_REACHED", "Daily limit reached.");
        error.retryAfter = 3600;
        throw error;
      },
      generate: async () => { generated = true; },
    });
    const res = responseStub();
    await handler({ method: "POST", body: { question: "corn" }, headers: {} }, res);
    assert.equal(generated, false);
    assert.equal(reserved, gate === "quota");
    assert.equal(res.statusCode, gate === "quota" ? 429 : 401);
    if (gate === "quota") assert.equal(res.headers["Retry-After"], "3600");
  }
});

test("a real verified identity is reserved before successful generation", async () => {
  const events = [];
  const handler = createGenerationHandler({
    admit: () => ({ allowed: true }),
    authenticate: async () => { events.push("verified"); return { id: "puter:real-user", provider: "puter" }; },
    reserveQuota: async (identity) => { assert.equal(identity.id, "puter:real-user"); events.push("reserved"); },
    generate: async () => { events.push("generated"); return "recipe"; },
    save: async () => {},
  });
  const res = responseStub();
  await handler({ method: "POST", body: { question: "corn", userId: "spoofed" } }, res);
  assert.deepEqual(events, ["verified", "reserved", "generated"]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "no-store");
});
