import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { createSharedQuota } from "../lib/generation-quota.js";

test("live MongoDB reservations remain bounded across independent clients", { skip: !process.env.MONGO_QUOTA_TEST_URI }, async () => {
  // Explicit dedicated test URI only. Never use the application's MONGODB_URI here.
  const uri = process.env.MONGO_QUOTA_TEST_URI;
  const clients = [new mongoose.mongo.MongoClient(uri), new mongoose.mongo.MongoClient(uri)];
  const name = `mise_quota_test_${randomUUID().replaceAll("-", "")}`;
  try {
    await Promise.all(clients.map((client) => client.connect()));
    const options = { env: { GENERATION_USER_MINUTE_LIMIT: "5" }, now: () => 0 };
    const instances = clients.map((client) => createSharedQuota({ ...options, getCollection: async () => client.db().collection(name) }));
    const identity = { id: "puter:integration-user", provider: "puter" };
    const results = await Promise.allSettled(Array.from({ length: 40 }, (_, index) => instances[index % 2](identity)));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 5);
    assert.ok(results.filter((result) => result.status === "rejected").every((result) => result.reason.status === 429));
  } finally {
    await clients[0].db().collection(name).drop().catch(() => {});
    await Promise.all(clients.map((client) => client.close()));
  }
});
