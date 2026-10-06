import test from "node:test";
import assert from "node:assert/strict";
import { buildQuotaBuckets, createSharedQuota, reserveMongoBucket } from "../lib/generation-quota.js";

// Models atomic document operations and duplicate-key races; live Mongo coverage is separate.
function atomicCollection() {
  const documents = new Map();
  return {
    documents,
    async findOneAndUpdate(filter, update, options) {
      assert.equal(options.writeConcern.w, "majority");
      assert.equal(options.includeResultMetadata, false);
      const doc = documents.get(filter._id);
      if (!doc || doc.count >= filter.count.$lt) return null;
      doc.count += update.$inc.count;
      return { ...doc };
    },
    async insertOne(doc) {
      if (documents.has(doc._id)) { const error = new Error("duplicate"); error.code = 11000; throw error; }
      documents.set(doc._id, { ...doc });
    },
  };
}

const identity = { id: "puter:user-1", provider: "puter" };

test("shared reservations do not exceed a bucket during simultaneous first requests", async () => {
  const collection = atomicCollection();
  const [bucket] = buildQuotaBuckets(identity, { GENERATION_USER_MINUTE_LIMIT: "5" }, 0);
  const results = await Promise.all(Array.from({ length: 50 }, () => reserveMongoBucket(collection, bucket)));
  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(collection.documents.get(bucket.id).count, 5);
});

test("two server instances share a per-user limit", async () => {
  const collection = atomicCollection();
  const opts = { getCollection: async () => collection, env: {}, now: () => 0 };
  const instances = [createSharedQuota(opts), createSharedQuota(opts)];
  const results = await Promise.allSettled(Array.from({ length: 30 }, (_, i) => instances[i % 2](identity)));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 5);
  assert.ok(results.filter((result) => result.status === "rejected").every((result) => result.reason.status === 429));
});

test("global daily limit is shared across distinct accounts", async () => {
  const collection = atomicCollection();
  const quota = createSharedQuota({ getCollection: async () => collection, env: { GENERATION_GLOBAL_DAY_LIMIT: "3" }, now: () => 0 });
  const results = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => quota({ id: `puter:user-${i}`, provider: "puter" })));
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 3);
  assert.ok(results.filter((result) => result.status === "rejected").every((result) => result.reason.code === "GENERATION_BUDGET_REACHED"));
});

test("minute reset does not reset the daily allowance, and next UTC day renews it", async () => {
  let clock = 0;
  const collection = atomicCollection();
  const quota = createSharedQuota({ getCollection: async () => collection, env: { GENERATION_USER_DAY_LIMIT: "1" }, now: () => clock });
  await quota(identity);
  clock = 60000;
  await assert.rejects(quota(identity), (error) => error.status === 429 && error.retryAfter === 86340);
  clock = 86400000;
  await quota(identity);
});

test("quota storage failures stop generation instead of falling back to memory", async () => {
  for (const getCollection of [async () => { throw new Error("credentials"); }, async () => ({ findOneAndUpdate: async () => { throw new Error("timeout"); } })]) {
    const quota = createSharedQuota({ getCollection, env: {}, now: () => 0 });
    await assert.rejects(quota(identity), (error) => error.status === 503 && error.code === "QUOTA_UNAVAILABLE" && !error.message.includes("credentials"));
  }
});

test("invalid settings and unverified identities fail before accessing storage", async () => {
  assert.throws(() => buildQuotaBuckets({ id: "demo-user", provider: "demo" }, {}, 0), (error) => error.status === 401);
  for (const limit of ["0", "-1", "abc", "1.5", "9007199254740992"]) {
    const quota = createSharedQuota({ getCollection: async () => assert.fail("must not access storage"), env: { GENERATION_USER_DAY_LIMIT: limit } });
    await assert.rejects(quota(identity), (error) => error.status === 503);
  }
});
