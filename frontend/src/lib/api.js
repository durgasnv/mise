const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Calls the recipe generation endpoint with ingredients or a cooking question.
 * @param {string} question - Query string (e.g. "Create a recipe with tomato, garlic, olive oil")
 * @returns {Promise<string>} - Raw text response containing recipe
 */
export async function generateRecipeApi(question, image = null) {
  const url = `${API_BASE_URL}/api/generate-recipe`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, image }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Server responded with status ${response.status}`);
  }

  if (!data?.response) {
    throw new Error("No recipe response received from the kitchen.");
  }

  return data.response;
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
