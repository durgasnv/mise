/**
 * Common kitchen substitutions dictionary for 1-click smart swaps.
 */
export const INGREDIENT_SUBSTITUTES_MAP = {
  butter: [
    { name: "Olive oil or Ghee", note: "1:1 ratio, clean rich flavor" },
    { name: "Toasted sesame oil", note: "Use half amount for smoky nutty flavor" },
    { name: "Coconut oil", note: "Great for high heat, subtle sweetness" },
  ],
  garlic: [
    { name: "Shallots", note: "Mild, sweet allium flavor" },
    { name: "Garlic powder", note: "1/4 tsp per clove" },
    { name: "Scallion whites", note: "Fresh, crisp onion punch" },
  ],
  chicken: [
    { name: "Firm Tofu", note: "Press dry and sear in cast iron" },
    { name: "Portobello or Shiitake Mushrooms", note: "Deep umami meatiness" },
    { name: "Pork chops or Pork belly", note: "Cook similarly with crispy crust" },
  ],
  corn: [
    { name: "Edamame", note: "Plump, sweet, high protein" },
    { name: "Diced zucchini", note: "Quick sear for fresh crunch" },
    { name: "Green peas", note: "Natural sweet pop" },
  ],
  gochujang: [
    { name: "Sriracha + Miso paste", note: "Balances heat with fermented depth" },
    { name: "Chili crisp + honey", note: "Crispy textured sweet heat" },
    { name: "Smoked paprika + hot sauce", note: "Warm smoky spice" },
  ],
  pasta: [
    { name: "Rice or Jasmine Rice", note: "Great sauce absorber" },
    { name: "Ramen or Udon noodles", note: "Chewy, fast-cooking" },
    { name: "Zucchini noodles / Cabbage ribbons", note: "Low carb, fresh crisp" },
  ],
  soy_sauce: [
    { name: "Tamari or Coconut Aminos", note: "Gluten-free / sweeter profile" },
    { name: "Worcestershire sauce + pinch salt", note: "Rich savory punch" },
    { name: "Miso dissolved in warm water", note: "Deep earthy umami" },
  ],
  egg: [
    { name: "Silken tofu", note: "For scrambles and stir-fries" },
    { name: "Avocado", note: "Rich creamy fatty finish" },
  ],
  rosemary: [
    { name: "Fresh Thyme or Oregano", note: "Woody, earthy herbs" },
    { name: "Crushed Bay Leaf", note: "Simmer for herbal depth" },
  ],
  shallot: [
    { name: "Red onion + pinch sugar", note: "Closest flavor and color" },
    { name: "Leeks or Scallions", note: "Delicate, sweet aromatics" },
  ],
};

/**
 * Gets substitutions for any ingredient name.
 * @param {string} rawIngredient
 * @returns {Array<{ name: string, note: string }>}
 */
export function getIngredientSubstitutes(rawIngredient) {
  if (!rawIngredient) return [];
  const lower = rawIngredient.toLowerCase();

  for (const [key, subs] of Object.entries(INGREDIENT_SUBSTITUTES_MAP)) {
    if (lower.includes(key.replace("_", " ")) || lower.includes(key)) {
      return subs;
    }
  }

  if (lower.includes("oil") || lower.includes("fat")) {
    return [
      { name: "Butter or Ghee", note: "Rich savory gloss" },
      { name: "Sesame oil", note: "Aromatic Asian finish" },
    ];
  }
  if (lower.includes("cheese")) {
    return [
      { name: "Nutritional yeast", note: "Cheesy umami seasoning" },
      { name: "Toasted breadcrumbs + salt", note: "Crunchy topping" },
    ];
  }
  if (lower.includes("cream") || lower.includes("milk")) {
    return [
      { name: "Coconut milk", note: "Thick, rich body" },
      { name: "Greek yogurt", note: "Tangy rich finish" },
    ];
  }

  return [
    { name: "Pinch of flaky sea salt & house olive oil", note: "Universal flavor enhancer" },
    { name: "Toasted sesame seeds & fresh herbs", note: "Adds aroma & texture" },
  ];
}

/**
 * Dynamically scales ingredient text based on portion ratio.
 * @param {Array<string>} ingredients
 * @param {number} targetPortions
 * @param {number} basePortions
 * @returns {Array<string>}
 */
export function scaleRecipeIngredients(ingredients) {
  // Retained for legacy imports. Text-only recipes cannot be safely scaled.
  return Array.isArray(ingredients) ? ingredients : [];
}

/** Parse only supplied recipe content; never fabricate cooking instructions. */
export function parseSingleRecipeChunk(chunk, originalIngredients = [], index = 0) {
  const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  const title = titleLine?.replace(/^#\s+/, "").replace(/\*\*/g, "").trim();
  const ingredients = [];
  const instructions = [];
  const metadata = { prepTime: "Not provided", cookTime: "Not provided", servings: "Not provided", calories: "Not provided" };
  let section = "header";
  let pairing = "Not provided";
  let quickSide = "Not provided";
  let chefNote = "";

  for (const line of lines) {
    if (line === titleLine) continue;
    const plain = line.replace(/\*\*/g, "");
    if (/^#{2,6}\s+/.test(line)) {
      const heading = plain.replace(/^#{2,6}\s+/, "").toLowerCase();
      section = heading === "ingredients" ? "ingredients"
        : /^(instructions|method|directions)$/.test(heading) ? "instructions"
          : /pairing|beverage/.test(heading) ? "pairing"
            : /tasting note|chef.s note/.test(heading) ? "notes" : "other";
      continue;
    }
    if (section === "header") {
      for (const [key, label] of [["prepTime", "Prep Time"], ["cookTime", "Cook Time"], ["servings", "Servings|Yield|Portions"], ["calories", "Calories|Cal"]]) {
        const match = plain.match(new RegExp(`(?:${label}):\\s*([^|]+)`, "i"));
        if (match) metadata[key] = match[1].trim();
      }
    } else if (section === "ingredients" && /^[-*•]\s+/.test(line)) {
      ingredients.push(plain.replace(/^[-*•]\s+/, "").trim());
    } else if (section === "instructions" && /^(?:\d+[.)]|[-*•])\s+/.test(line)) {
      instructions.push(plain.replace(/^(?:\d+[.)]|[-*•])\s+/, "").trim());
    } else if (section === "pairing") {
      const drink = plain.match(/^(?:[-*•]\s*)?(?:Craft Drink|Drink|Beverage):\s*(.+)$/i);
      const side = plain.match(/^(?:[-*•]\s*)?(?:Quick Companion Side|Side|Companion Side):\s*(.+)$/i);
      if (drink) pairing = drink[1];
      if (side) quickSide = side[1];
    } else if (section === "notes") {
      chefNote += (chefNote ? " " : "") + plain;
    }
  }

  if (!title || !ingredients.length || !instructions.length) {
    throw new Error("The recipe response was incomplete. Please try again.");
  }
  const portions = Number(metadata.servings.match(/\d+(?:\.\d+)?/)?.[0]);
  return {
    id: `recipe-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    ...metadata,
    basePortions: portions > 0 ? portions : 2,
    ingredients,
    instructions,
    pairing,
    quickSide,
    chefNote,
    tags: [`Option ${index + 1}`],
    createdAt: new Date().toISOString(),
    rawText: chunk,
  };
}

/** Return only complete recipes supplied by the provider, up to three. */
export function parseRecipeResponse(rawText, originalIngredients = []) {
  if (typeof rawText !== "string" || !rawText.trim()) {
    throw new Error("The kitchen returned no recipes. Please try again.");
  }
  const chunks = rawText.includes("---RECIPE_DIVIDER---")
    ? rawText.split("---RECIPE_DIVIDER---")
    : rawText.includes("===RECIPE_SPLIT===")
      ? rawText.split("===RECIPE_SPLIT===")
      : rawText.trim().split(/\n(?=# )/);
  const content = chunks.map((chunk) => chunk.trim()).filter(Boolean);
  if (content.length > 3) {
    throw new Error("The recipe response had an unexpected format. Please try again.");
  }
  return content.map((chunk, index) => parseSingleRecipeChunk(chunk, originalIngredients, index));
}
