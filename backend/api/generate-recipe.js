import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Query } from "../models/Query.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TEXT_MODEL = "llama-3.1-8b-instant";
const GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview";
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

async function callGroq({ question, imageBase64 }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in backend environment.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const isVision = Boolean(imageBase64);
    const model = isVision ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;

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
            url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
          },
        },
      ];
    } else {
      userContent = question;
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (isVision && question) {
        console.warn("Vision model failed, falling back to text model...");
        return callGroq({ question, imageBase64: null });
      }
      throw new Error(data?.error?.message || `Groq API responded with status ${response.status}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq API returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out (25s).");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const question = body?.question?.trim();
  const imageBase64 = body?.image;

  if (!question && !imageBase64) {
    return res.status(400).json({ error: "Either question or image is required." });
  }

  try {
    const db = await ensureDB().catch((err) => {
      console.warn("DB skip:", err.message);
      return null;
    });

    let response;
    try {
      response = await callGroq({ question, imageBase64 });
    } catch (groqError) {
      console.error("Groq call failed:", groqError.message);
      return res.status(500).json({ error: `Kitchen generation notice: ${groqError.message}` });
    }

    if (db) {
      try {
        await Query.create({ question: question || "Image pantry query", response });
      } catch (err) {
        console.warn("Query save skipped:", err.message);
      }
    }

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Handler error:", error.message);
    return res.status(500).json({ error: "Something went wrong in the kitchen." });
  }
}
