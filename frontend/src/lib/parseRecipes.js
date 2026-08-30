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

  // Fallback smart general swaps
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
export function scaleRecipeIngredients(ingredients, targetPortions = 2, basePortions = 2) {
  if (!Array.isArray(ingredients)) return [];
  if (targetPortions === basePortions || basePortions <= 0) return ingredients;

  const factor = targetPortions / basePortions;

  return ingredients.map((item) => {
    // Match fractions like 1/2, 3/4, or numbers like 2, 2.5, 200
    return item.replace(/(\d+(?:\.\d+)?|\d+\/\d+)/g, (match) => {
      let val;
      if (match.includes("/")) {
        const [num, den] = match.split("/").map(Number);
        val = num / den;
      } else {
        val = parseFloat(match);
      }

      const scaled = val * factor;
      if (scaled >= 10) return Math.round(scaled).toString();
      if (scaled === 0.5) return "1/2";
      if (scaled === 0.25) return "1/4";
      if (scaled === 0.75) return "3/4";
      if (scaled === 1.5) return "1 1/2";
      return (Math.round(scaled * 10) / 10).toString();
    });
  });
}

/**
 * Parses raw LLM text into a structured recipe object.
 * @param {string} rawText
 * @param {string[]} [originalIngredients=[]]
 * @returns {object}
 */
export function parseRecipeResponse(rawText, originalIngredients = []) {
  if (!rawText || typeof rawText !== "string") {
    return createFallbackRecipe(originalIngredients);
  }

  const cleanText = rawText.trim();

  // Try JSON if applicable
  if (cleanText.startsWith("{") && cleanText.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanText);
      return {
        id: parsed.id || `recipe-${Date.now()}`,
        title: parsed.title || parsed.recipeName || "Chef's Hearth Creation",
        prepTime: parsed.prepTime || "15 mins",
        cookTime: parsed.cookTime || "15 mins",
        servings: parsed.servings || "2 portions",
        basePortions: 2,
        calories: parsed.calories || "~450 kcal",
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : originalIngredients,
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : ["Prepare fresh and sear hot."],
        pairing: parsed.pairing || "Charred Yuzu Highball with a twist of lemon",
        quickSide: parsed.quickSide || "Whipped Garlic-Miso Butter with warm toast",
        chefNote: parsed.chefNote || "Always rest meats 3 minutes before slicing to lock in smokehouse juices.",
        tags: parsed.tags || ["Smokehouse Special", "3-Ingredient Feast", "Scratch Kitchen"],
        createdAt: new Date().toISOString(),
        rawText,
      };
    } catch {
      // Fall through to markdown parser
    }
  }

  const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = "";
  let prepTime = "15 mins";
  let cookTime = "15 mins";
  let servings = "2 portions";
  let calories = "~480 kcal";
  let chefNote = "";
  let pairing = "Charred Citrus Highball or Iced Smoky Green Tea";
  let quickSide = "Whipped Miso Butter with crusty bread";
  const ingredients = [];
  const instructions = [];

  let currentSection = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Title from first header or bold line
    if (!title && (line.startsWith("#") || line.startsWith("**") || i === 0)) {
      const cleanTitle = line.replace(/^[#*\s]+|[#*\s]+$/g, "").replace(/^Recipe:\s*/i, "");
      if (cleanTitle && !cleanTitle.toLowerCase().includes("ingredient") && !cleanTitle.toLowerCase().includes("instruction")) {
        title = cleanTitle;
        continue;
      }
    }

    // Detect Meta info
    const prepMatch = line.match(/(?:Prep\s*Time):\s*([^\n|*]+)/i);
    if (prepMatch) prepTime = prepMatch[1].replace(/[*_]/g, "").trim();

    const cookMatch = line.match(/(?:Cook\s*Time):\s*([^\n|*]+)/i);
    if (cookMatch) cookTime = cookMatch[1].replace(/[*_]/g, "").trim();

    const servMatch = line.match(/(?:Servings|Yield|Portions):\s*([^\n|*]+)/i);
    if (servMatch) servings = servMatch[1].replace(/[*_]/g, "").trim();

    const calMatch = line.match(/(?:Calories|Cal):\s*([^\n|*]+)/i);
    if (calMatch) calories = calMatch[1].replace(/[*_]/g, "").trim();

    // Section triggers
    const lower = line.toLowerCase();
    if (lower.includes("ingredient")) {
      currentSection = "ingredients";
      continue;
    } else if (lower.includes("instruction") || lower.includes("method") || lower.includes("step") || lower.includes("directions")) {
      currentSection = "instructions";
      continue;
    } else if (lower.includes("pairing") || lower.includes("beverage")) {
      currentSection = "pairing";
      continue;
    } else if (lower.includes("chef's note") || lower.includes("tasting note") || lower.includes("tip:")) {
      currentSection = "notes";
      continue;
    }

    // Capture sections
    if (currentSection === "ingredients") {
      if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        ingredients.push(line.replace(/^[-*•\d.]+\s+/, "").replace(/[*_]/g, "").trim());
      } else if (line.length > 2 && !line.startsWith("#")) {
        ingredients.push(line.replace(/[*_]/g, "").trim());
      }
    } else if (currentSection === "instructions") {
      if (/^\d+[\.\)]\s+/.test(line) || /^[-*•]\s+/.test(line) || /^Step\s+\d+/i.test(line)) {
        instructions.push(line.replace(/^(?:Step\s*\d+:?|\d+[\.\)]|[-*•])\s*/i, "").replace(/[*_]/g, "").trim());
      } else if (line.length > 5 && !line.startsWith("#")) {
        instructions.push(line.replace(/[*_]/g, "").trim());
      }
    } else if (currentSection === "pairing") {
      if (lower.includes("drink") || lower.includes("beverage") || lower.includes("cocktail")) {
        pairing = line.replace(/^(?:[-*•]\s*)?(?:\*\*|\*)?(?:Craft Drink|Drink|Beverage):\s*/i, "").replace(/[*_]/g, "").trim();
      } else if (lower.includes("side") || lower.includes("companion")) {
        quickSide = line.replace(/^(?:[-*•]\s*)?(?:\*\*|\*)?(?:Quick Companion Side|Side|Companion Side):\s*/i, "").replace(/[*_]/g, "").trim();
      }
    } else if (currentSection === "notes") {
      chefNote += (chefNote ? " " : "") + line.replace(/^(?:Chef's Note:?|Tip:?|Note:?)\s*/i, "").replace(/[*_]/g, "");
    }
  }

  // Fallbacks
  if (!title) {
    title = originalIngredients.length > 0
      ? `Artisanal ${originalIngredients.slice(0, 2).map(capitalize).join(" & ")} Feast`
      : "Smokehouse Hearth Feast";
  }

  if (ingredients.length === 0) {
    if (originalIngredients.length > 0) {
      originalIngredients.forEach((ing) => ingredients.push(`2 cups Fresh ${capitalize(ing)}`));
      ingredients.push("2 tbsp Cultured butter or house olive oil");
      ingredients.push("Pinch of smoked sea salt & freshly cracked pepper");
    } else {
      ingredients.push("200g Core protein or vegetable");
      ingredients.push("2 tbsp House cooking fat or aromatics");
      ingredients.push("Seasoning blend & fresh herbs");
    }
  }

  if (instructions.length === 0) {
    instructions.push("Preheat a heavy cast-iron skillet over medium-high heat with a splash of oil.");
    instructions.push("Prep and slice all ingredients evenly into bite-sized pieces.");
    instructions.push("Sear ingredients undisturbed for 3-4 minutes to achieve deep golden caramelization.");
    instructions.push("Toss with aromatics, season generously with sea salt, and serve hot from the hearth.");
  }

  return {
    id: `recipe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    prepTime,
    cookTime,
    servings,
    basePortions: 2,
    calories,
    ingredients,
    instructions,
    pairing: pairing || "Charred Citrus Highball or Smoky Iced Jasmine Tea",
    quickSide: quickSide || "Whipped Garlic Butter with warm charred flatbread",
    chefNote: chefNote || "Finish with a splash of fresh lime or rice vinegar right before serving to awaken all rich flavors.",
    tags: ["Smokehouse Signature", "3-Ingredient Feast", "Scratch Kitchen"],
    createdAt: new Date().toISOString(),
    rawText,
  };
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createFallbackRecipe(ingredients = ["Garlic", "Butter", "Pasta"]) {
  const safeIngs = ingredients.length > 0 ? ingredients : ["Garlic", "Butter", "Pasta"];
  return {
    id: `fallback-${Date.now()}`,
    title: `Classic ${safeIngs.slice(0, 2).map(capitalize).join(" & ")} Sauté`,
    prepTime: "10 mins",
    cookTime: "12 mins",
    servings: "2 portions",
    basePortions: 2,
    calories: "~460 kcal",
    ingredients: [
      ...safeIngs.map((i) => `250g Fresh ${capitalize(i)}`),
      "2 tbsp Cultured butter or olive oil",
      "Pinch of kosher flake sea salt & black pepper",
    ],
    instructions: [
      `Gently prep and slice your fresh ${safeIngs[0] || "pantry ingredients"}.`,
      "Heat a cast-iron skillet or heavy sauté pan over gentle medium flame with butter.",
      "Sauté aromatics until fragrant, toasted pale golden, and sizzling.",
      "Combine all components, toss to coat evenly in the savory pan juices, and serve hot.",
    ],
    pairing: "Smoky Lemon Iced Green Tea",
    quickSide: "Pickled Cucumber Ribbons with sesame seeds",
    chefNote: "A tiny splash of acid (lemon or vinegar) balances the rich fat of the butter.",
    tags: ["Quick Feast", "Pantry Classic", "Artisanal"],
    createdAt: new Date().toISOString(),
    rawText: "Classic Fallback Recipe",
  };
}
