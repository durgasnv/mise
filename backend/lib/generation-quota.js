import { createHash } from "node:crypto";
import { connectDB } from "../config/database.js";
import { GenerationError } from "./generation-guards.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const writeOptions = { maxTimeMS: 3000, writeConcern: { w: "majority", wtimeoutMS: 3000 } };
const indexPromises = new WeakMap();

function configuredLimit(value, fallback) {
  if (value == null || value === "") return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    throw new GenerationError(503, "QUOTA_UNAVAILABLE", "Recipe generation limits are unavailable. Please try again later.");
  }
  return Number(value);
}

export function buildQuotaBuckets(identity, env = process.env, timestamp = Date.now()) {
  if (identity?.provider !== "puter" || typeof identity.id !== "string" || !identity.id.startsWith("puter:")) {
    throw new GenerationError(401, "AUTH_REQUIRED", "Sign in with Puter to generate recipes.");
  }
  const userKey = createHash("sha256").update(identity.id).digest("hex");
  return [
    ["user-minute", userKey, MINUTE_MS, configuredLimit(env.GENERATION_USER_MINUTE_LIMIT, 5)],
    ["user-day", userKey, DAY_MS, configuredLimit(env.GENERATION_USER_DAY_LIMIT, 20)],
    ["global-day", "all", DAY_MS, configuredLimit(env.GENERATION_GLOBAL_DAY_LIMIT, 200)],
  ].map(([scope, subject, windowMs, limit]) => {
    const start = Math.floor(timestamp / windowMs) * windowMs;
    return {
      scope,
      id: `generation:${scope}:${subject}:${start}`,
      limit,
      expiresAt: new Date(start + windowMs + DAY_MS),
      retryAfter: Math.max(1, Math.ceil((start + windowMs - timestamp) / 1000)),
      code: scope === "global-day" ? "GENERATION_BUDGET_REACHED" : "USER_QUOTA_REACHED",
    };
  });
}

export async function reserveMongoBucket(collection, bucket) {
  const filter = { _id: bucket.id, count: { $lt: bucket.limit } };
  const options = { ...writeOptions, returnDocument: "after", includeResultMetadata: false };
  let reserved = await collection.findOneAndUpdate(filter, { $inc: { count: 1 } }, options);
  if (reserved) return true;
  try {
    // _id's unique index resolves simultaneous first requests from different instances.
    await collection.insertOne({ _id: bucket.id, count: 1, expiresAt: bucket.expiresAt }, writeOptions);
    return true;
  } catch (error) {
    if (error.code !== 11000) throw error;
    reserved = await collection.findOneAndUpdate(filter, { $inc: { count: 1 } }, options);
    return Boolean(reserved);
  }
}

async function getQuotaCollection() {
  const connection = await connectDB();
  if (!connection?.db) throw new Error("Shared quota database unavailable");
  if (!indexPromises.has(connection.db)) {
    const collection = connection.db.collection("generation_quotas");
    const promise = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "generation_quota_expiry", ...writeOptions })
      .catch((error) => { indexPromises.delete(connection.db); throw error; });
    indexPromises.set(connection.db, promise);
  }
  await indexPromises.get(connection.db);
  return connection.db.collection("generation_quotas");
}

export function createSharedQuota({ getCollection = getQuotaCollection, env = process.env, now = Date.now } = {}) {
  return async (identity) => {
    const buckets = buildQuotaBuckets(identity, env, now());
    try {
      const collection = await getCollection();
      for (const bucket of buckets) {
        if (!await reserveMongoBucket(collection, bucket)) {
          const error = new GenerationError(429, bucket.code,
            bucket.code === "GENERATION_BUDGET_REACHED"
              ? "The kitchen has reached its daily generation limit. Please try again tomorrow."
              : bucket.scope === "user-day"
                ? "You have reached your daily recipe limit. Please try again tomorrow."
                : "You have made several recipe requests. Please wait a minute and try again.");
          error.retryAfter = bucket.retryAfter;
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof GenerationError) throw error;
      throw new GenerationError(503, "QUOTA_UNAVAILABLE", "We could not check recipe limits right now. Please try again later.");
    }
  };
}

export const reserveGenerationQuota = createSharedQuota();
