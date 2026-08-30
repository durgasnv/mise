import "dotenv/config";
import { connectDB } from "../config/database.js";
import { Query } from "../models/Query.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_TEXT_MODEL = "llama-3.1-8b-instant";
const GROQ_VISION_MODEL = "llama-3.2-11b-vision-preview";
const GROQ_TIMEOUT_MS = 20000;

const SYSTEM_PROMPT = `You are an elite culinary master chef and pitmaster at an artisanal Asian-Texas smokehouse & kitchen.
When the user provides ingredients or asks for a recipe, create a mouth-watering, elevated, restaurant-quality recipe.

Format your response cleanly with the following markdown structure:
# [Exciting Dish Title]
**Prep Time:** [e.g. 15 mins] | **Cook Time:** [e.g. 20 mins] | **Servings:** 2 portions | **Calories:** [e.g. ~480 kcal]

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

let isConnected = false;

async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
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
          text: question || "Identify the 3 best food ingredients in this fridge/pantry photo and create an elevated, delicious recipe with them.",
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
      // If vision fails, try text fallback if question exists
      if (isVision && question) {
        console.warn("Vision model failed, retrying with text model...");
        return callGroq({ question, imageBase64: null });
      }
      throw new Error(data?.error?.message || "Groq API request failed.");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Groq API returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out (20s).");
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
    await ensureDB().catch((err) => console.error("DB connection notice:", err.message));

    let response;
    try {
      response = await callGroq({ question, imageBase64 });
    } catch (groqError) {
      console.error("Groq failed:", groqError.message);
      return res.status(500).json({ error: `Kitchen error: ${groqError.message}` });
    }

    await Query.create({ question: question || "Image pantry query", response }).catch((err) =>
      console.error("DB save notice:", err.message)
    );

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Handler failed:", error.message);
    return res.status(500).json({ error: "Something went wrong in the kitchen." });
  }
}
