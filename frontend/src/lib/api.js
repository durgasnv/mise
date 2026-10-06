import { getGenerationAuthorization } from "./auth.js";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "";

/**
 * Calls the recipe generation endpoint with ingredients or a cooking question.
 * @param {string} question - Query string (e.g. "Create a recipe with tomato, garlic, olive oil")
 * @returns {Promise<string>} - Raw text response containing recipe
 */
export async function generateRecipeApi(question, image = null) {
  const url = `${API_BASE_URL}/api/generate-recipe`;
  const authorization = getGenerationAuthorization();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authorization,
      },
      body: JSON.stringify({ question, image }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(typeof data?.error === "string" ? data.error : "We could not generate recipes right now. Please try again.");
      error.code = typeof data?.code === "string" ? data.code : undefined;
      throw error;
    }

    if (typeof data?.response !== "string" || !data.response.trim()) {
      throw new Error("No recipe response received from the kitchen. Please try again.");
    }

    return data.response;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Recipe generation took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Checks backend health status.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const url = `${API_BASE_URL}/api/health`;
    const res = await fetch(url);
    const data = await res.json();
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}
