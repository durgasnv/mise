import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readBody } from "../lib/read-request-body.js";
import { MAX_BODY_BYTES } from "../lib/generation-guards.js";

test("reads UTF-8 correctly when a character crosses chunk boundaries", async () => {
  const req = new EventEmitter();
  const body = readBody(req);
  const bytes = Buffer.from("食材");
  req.emit("data", bytes.subarray(0, 1));
  req.emit("data", bytes.subarray(1));
  req.emit("end");
  assert.equal(await body, "食材");
});

test("rejects oversized HTTP bodies and ignores subsequent chunks", async () => {
  const req = new EventEmitter();
  const body = readBody(req);
  req.emit("data", Buffer.alloc(MAX_BODY_BYTES));
  req.emit("data", Buffer.from("x"));
  req.emit("data", Buffer.from("more data"));
  req.emit("end");
  await assert.rejects(body, (error) => error.status === 413);
});

test("rejects interrupted HTTP uploads", async () => {
  const req = new EventEmitter();
  const body = readBody(req);
  req.emit("aborted");
  await assert.rejects(body, (error) => error.status === 400);
});
