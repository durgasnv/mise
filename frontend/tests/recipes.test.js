import test from "node:test";
import assert from "node:assert/strict";
import { parseRecipeResponse } from "../src/lib/parseRecipes.js";

const recipe = `# Corn bowl
**Prep Time:** 5 mins | **Cook Time:** 10 mins | **Servings:** 4 portions | **Calories:** ~200 kcal

### Ingredients
- 2 cups corn
- 1 tbsp olive oil

### Instructions
1. Heat the oil.
2. Cook the corn for 5 minutes, stirring at each step.

### Beverage & Side Pairing
- **Craft Drink:** Water
- **Quick Companion Side:** None

### Chef's Tasting Note
Taste before serving.`;

test("one actual recipe is not padded with invented alternatives", () => {
  const parsed = parseRecipeResponse(recipe, ["corn"]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, "Corn bowl");
  assert.deepEqual(parsed[0].ingredients, ["2 cups corn", "1 tbsp olive oil"]);
  assert.equal(parsed[0].instructions.length, 2);
  assert.equal(parsed[0].basePortions, 4);
  assert.equal(parsed[0].prepTime, "5 mins");
  assert.equal(parsed[0].calories, "~200 kcal");
  assert.equal(parsed[0].pairing, "Water");
});

test("splits real recipes with supported dividers or top-level headings", () => {
  for (const delimiter of ["\n---RECIPE_DIVIDER---\n", "\n===RECIPE_SPLIT===\n", "\n"]) {
    assert.equal(parseRecipeResponse([recipe, recipe, recipe].join(delimiter)).length, 3);
  }
});

test("empty and incomplete responses fail instead of manufacturing instructions", () => {
  for (const text of [null, "", "# Corn bowl", "# Corn bowl\n### Ingredients\n- Corn", "# Corn bowl\n### Instructions\n1. Cook.", `${recipe}\n---RECIPE_DIVIDER---\n# Broken`]) {
    assert.throws(() => parseRecipeResponse(text, ["raw chicken"]));
  }
});

test("missing optional metadata is unavailable rather than invented", () => {
  const [parsed] = parseRecipeResponse("# Corn\n### Ingredients\n- Corn\n### Instructions\n1. Cook the corn.");
  assert.equal(parsed.calories, "Not provided");
  assert.equal(parsed.quickSide, "Not provided");
  assert.equal(parsed.prepTime, "Not provided");
});

test("unexpected counts are rejected rather than silently discarding content", () => {
  assert.throws(() => parseRecipeResponse([recipe, recipe, recipe, recipe].join("\n---RECIPE_DIVIDER---\n")));
});
