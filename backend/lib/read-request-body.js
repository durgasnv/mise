import { GenerationError, MAX_BODY_BYTES } from "./generation-guards.js";

export function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    let exceeded = false;
    req.on("data", (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.length;
      if (size > MAX_BODY_BYTES) {
        if (!exceeded) reject(new GenerationError(413, "INPUT_TOO_LARGE", "Request too large. Use a photo up to 2 MB."));
        exceeded = true;
        chunks = [];
        return;
      }
      if (!exceeded) chunks.push(bytes);
    });
    req.on("end", () => {
      if (!exceeded) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
    req.on("aborted", () => reject(new GenerationError(400, "INVALID_INPUT", "The request was interrupted. Please try again.")));
  });
}
