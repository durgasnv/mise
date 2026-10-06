import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Query } from "../models/Query.js";
import { GenerationError, validateGenerationBody, createGenerationLimiter } from "../lib/generation-guards.js";
import { authenticateGeneration } from "../lib/generation-auth.js";
import { reserveGenerationQuota } from "../lib/generation-quota.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TIMEOUT_MS = 25000;

const SYSTEM_PROMPT = `You are the executive chef and pitmaster at Mise, an artisanal Asian-Texas smokehouse & kitchen.
When given ingredients (or a fridge photo), create exactly 3 DISTINCT, mouth-watering, restaurant-quality recipe options showcasing different culinary techniques (e.g. Option 1: Quick High-Heat Sauté, Option 2: Comforting Braise/Noodle Bowl, Option 3: Crispy Cast-Iron/Oven Roast).

Separate each of the 3 recipes with the exact marker line:
---RECIPE_DIVIDER---

For EACH of the 3 recipes, follow this exact structure:
# [Exciting Dish Title]
**Prep Time:** [e.g. 15 mins] | **Cook Time:** [e.g. 15 mins] | **Servings:** 2 portions | **Calories:** [e.g. ~480 kcal]

### Ingredients
- [Quantity] [Ingredient 1 with preparation, e.g. 2 ears Fresh sweet corn, charred]
- [Quantity] [Ingredient 2 with preparation]
- [Quantity] [Ingredient 3 with preparation]
- [Pantry staples like salt, pepper, oil, butter, lemon]

### Instructions
1. [Clear step-by-step instruction with specific timing and heat levels]
2. [Next step with sensory cues: golden amber, sizzling, fragrant]
3. [Finishing touches]

### Beverage & Side Pairing
- **Craft Drink:** [e.g. Charred Citrus Highball or Smoky Iced Jasmine Tea - 1 line flavor note]
- **Quick Companion Side:** [e.g. 2-ingredient side like Whipped Garlic Butter or Quick Pickled Cucumbers]

### Chef's Tasting Note
[A short 1-2 sentence pro chef secret on balancing acid, fat, heat, or texture.]`;

let dbConnection = null;

async function ensureDB() {
  if (!dbConnection) {
    dbConnection = await connectDB();
  }
  return dbConnection;
}

export async function callGroq({ question, imageBase64 }, { env = process.env, fetchImpl = fetch } = {}) {
  if (!env.GROQ_API_KEY) {
    throw new GenerationError(503, "GENERATION_UNAVAILABLE", "Recipe generation is temporarily unavailable. Please try again later.");
  }
  const isVision = Boolean(imageBase64);
  const model = isVision ? env.GROQ_VISION_MODEL?.trim() : (env.GROQ_TEXT_MODEL?.trim() || "openai/gpt-oss-20b");
  if (!model) {
    throw new GenerationError(503, "VISION_UNAVAILABLE", "Photo scanning is unavailable. Remove the photo and enter your ingredients to continue.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    let userContent;
    if (isVision) {
      userContent = [
        {
          type: "text",
          text: question || "Identify the best food ingredients in this fridge/pantry photo and create 3 distinct elevated recipes with them.",
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64,
          },
        },
      ];
    } else {
      userContent = question;
    }

    const response = await fetchImpl(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
        max_completion_tokens: 4096,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.warn("Groq generation rejected", { status: response.status, model });
      throw new GenerationError(
        response.status === 429 ? 429 : 502,
        isVision ? "VISION_FAILED" : "GENERATION_FAILED",
        isVision
          ? "We could not read this photo. Try another photo, or remove it and enter your ingredients."
          : response.status === 429
            ? "The kitchen is busy. Please wait a minute and try again."
            : "We could not generate recipes right now. Please try again."
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim() || data?.choices?.[0]?.finish_reason === "length") {
      throw new GenerationError(502, "INCOMPLETE_RESPONSE", "The recipe response was incomplete. Please try again.");
    }

    return content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new GenerationError(504, "GENERATION_TIMEOUT", "Recipe generation took too long. Please try again.");
    }
    if (error instanceof GenerationError) throw error;
    throw new GenerationError(502, isVision ? "VISION_FAILED" : "GENERATION_FAILED",
      isVision ? "We could not read this photo. Remove it and enter your ingredients, or try another photo."
        : "We could not reach the kitchen. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

const admitRequest = createGenerationLimiter();

async function saveQuery(question, response) {
  const db = await ensureDB();
  if (db) await Query.create({ question: question || "Image pantry query", response });
}

export function createGenerationHandler({ generate = callGroq, save = saveQuery, admit = admitRequest, authenticate = authenticateGeneration, reserveQuota = reserveGenerationQuota } = {}) {
  return async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
      const input = validateGenerationBody(req.body);
      const admission = admit();
      if (!admission.allowed) {
        res.setHeader("Retry-After", String(admission.retryAfter));
        return res.status(429).json({ code: "RATE_LIMITED", error: "The kitchen is busy. Please wait a minute and try again." });
      }
      const identity = await authenticate(req);
      await reserveQuota(identity);
      const response = await generate(input);
      // Logging failure must not replace a successful generation with an error.
      await save(input.question, response).catch(() => console.warn("Recipe history could not be saved."));
      return res.status(200).json({ response });
    } catch (error) {
      const knownError = error instanceof GenerationError;
      const status = knownError ? error.status : 500;
      if (status === 429) res.setHeader("Retry-After", String(error.retryAfter || 60));
      if (status >= 500) console.warn("Recipe generation failed", { code: knownError ? error.code : "INTERNAL_ERROR" });
      return res.status(status).json({
        code: knownError ? error.code : "INTERNAL_ERROR",
        error: knownError ? error.message : "Something went wrong in the kitchen. Please try again.",
      });
    }
  };
}

export default createGenerationHandler();
