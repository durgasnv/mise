import { queueMeasurement } from './measurements.js';
import { cookbookOwner } from './savedRecipes.js';
import { validateConstraints, reviewPantry } from "../../../shared/pantry.js";
import { reviewSafety } from "../../../shared/recipe-safety.js";
import { validateRecipes, recipeView } from "../../../shared/recipes.js";
import { getGenerationAuthorization, getCurrentUser } from "./auth.js";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "";

/**
 * Calls the recipe generation endpoint with ingredients or a cooking question.
 * @param {string} question - Query string (e.g. "Create a recipe with tomato, garlic, olive oil")
 * @returns {Promise<Array<object>>} - Validated recipe views with structured source data
 */
export async function generateRecipeApi(question, image = null, constraints = undefined, adaptation = undefined) {
  const started = Date.now(), owner = cookbookOwner();
  const url = `${API_BASE_URL}/api/generate-recipe`;
  const authorization = getGenerationAuthorization();
  const accountId = getCurrentUser()?.id;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authorization,
      },
      body: JSON.stringify({ question, image, constraints, ...(adaptation || {}) }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(typeof data?.error === "string" ? data.error : "We could not generate recipes right now. Please try again.");
      error.code = typeof data?.code === "string" ? data.code : undefined;
      throw error;
    }

    if (!Array.isArray(data?.recipes)) {
      throw new Error("No recipe response received from the kitchen. Please try again.");
    }

    if (!accountId || getCurrentUser()?.id !== accountId || data.accountId !== `puter:${accountId}`) throw new Error('Your account changed during generation. Please retry after signing in.');
    const checkedConstraints = validateConstraints(data.constraints);
    const result = validateRecipes({ recipes: data.recipes }).map(r => recipeView(r, { constraints: checkedConstraints,
      review: { ...reviewPantry(r, checkedConstraints), ...reviewSafety(r, checkedConstraints) } }));
    queueMeasurement("generated",{ durationMs: Math.min(120000,Date.now() - started) },owner);
    return result;
  } catch (error) {
    queueMeasurement("generationFailed",{ durationMs: Math.min(120000,Date.now() - started), errorCode: error.name === "AbortError" ? "GENERATION_TIMEOUT" : error.code || "CLIENT_ERROR" },owner);
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

export async function adaptRecipeApi(recipe, ingredientId, replacement) {
  const [adapted] = await generateRecipeApi('Adapt this dinner for the confirmed replacement.', null,
    { ...recipe.constraints, servings: recipe.structured.servings },
    { action: 'adapt', recipe: recipe.structured, ingredientId, replacement });
  return adapted;
}
