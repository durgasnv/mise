import { prepareAdaptation } from "../../shared/recipe-adaptation.js";
import { validateConstraints } from "../../shared/pantry.js";
export const MAX_QUESTION_LENGTH = 6000;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_BODY_BYTES = 3 * 1024 * 1024;

export class GenerationError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function validateGenerationBody(rawBody) {
  let body = rawBody;
  if (typeof body === "string") {
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw new GenerationError(413, "INPUT_TOO_LARGE", "Use a smaller photo (up to 2 MB) or a shorter ingredient list.");
    }
    try {
      body = JSON.parse(body);
    } catch {
      throw new GenerationError(400, "INVALID_INPUT", "Send a valid ingredient request.");
    }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new GenerationError(400, "INVALID_INPUT", "Send an ingredient list or a photo.");
  }
  if (body.question != null && typeof body.question !== "string") {
    throw new GenerationError(400, "INVALID_INPUT", "The ingredient list must be text.");
  }
  if (body.image != null && typeof body.image !== "string") {
    throw new GenerationError(400, "INVALID_INPUT", "The photo must be a JPEG, PNG, or WebP image.");
  }
  const question = (body.question || "").trim();
  const image = body.image || null;
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new GenerationError(413, "INPUT_TOO_LARGE", "Keep the ingredient list and notes under 6,000 characters.");
  }
  if (image) {
    // Only embedded image data is allowed; arbitrary remote URLs are not fetched.
    const match = image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || match[2].length % 4 !== 0) {
      throw new GenerationError(400, "INVALID_IMAGE", "Upload a JPEG, PNG, or WebP photo.");
    }
    if (match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
      throw new GenerationError(413, "INPUT_TOO_LARGE", "Use a smaller photo (up to 2 MB).");
    }
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw new GenerationError(413, "INPUT_TOO_LARGE", "Use a smaller photo (up to 2 MB).");
    }
    const validSignature = match[1] === "jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : match[1] === "png"
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
    if (!validSignature) {
      throw new GenerationError(400, "INVALID_IMAGE", "The uploaded data does not match its photo format. Choose another photo.");
    }
  }
  if (!question && !image) {
    throw new GenerationError(400, "INVALID_INPUT", "Enter ingredients or add a photo first.");
  }
  let constraints;
  try { constraints = validateConstraints(body.constraints); }
  catch (error) { throw new GenerationError(400, "INVALID_CONSTRAINTS", error.message); }
  if (body.action !== undefined && !['generate', 'adapt'].includes(body.action)) throw new GenerationError(400, "INVALID_INPUT", "Unknown recipe action.");
  if (body.action === 'adapt') {
    try {
      if (!body.constraints || image) throw new Error('Adaptation needs a confirmed pantry and a structured recipe.');
      const adaptation = prepareAdaptation(body.recipe, body.ingredientId, body.replacement, constraints);
      return { question, imageBase64: null, constraints: adaptation.constraints, adaptation };
    } catch (error) { throw new GenerationError(400, "INVALID_ADAPTATION", error.message); }
  }
  return { question, imageBase64: image, constraints };
}

// Baseline for one running process, NOT a shared quota or a production spending cap.
// Global admission deliberately avoids trusting spoofable forwarded IP headers.
export function createGenerationLimiter({ limit = 20, windowMs = 60_000, now = Date.now } = {}) {
  let windowStart = now();
  let count = 0;
  return () => {
    const current = now();
    if (current - windowStart >= windowMs) {
      windowStart = current;
      count = 0;
    }
    if (count >= limit) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((windowMs - (current - windowStart)) / 1000)) };
    }
    count += 1;
    return { allowed: true };
  };
}
