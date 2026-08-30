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
export function scaleRecipeIngredients(ingredients, targetPortions = 2, basePortions = 2) {
  if (!Array.isArray(ingredients)) return [];
  if (targetPortions === basePortions || basePortions <= 0) return ingredients;

  const factor = targetPortions / basePortions;

  return ingredients.map((item) => {
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
 * Parses a single recipe markdown chunk into a structured object.
 */
export function parseSingleRecipeChunk(cleanChunk, originalIngredients = [], fallbackIndex = 0) {
  const lines = cleanChunk.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = "";
  let prepTime = "15 mins";
  let cookTime = "15 mins";
  let servings = "2 portions";
  let calories = "~480 kcal";
  let chefNote = "";
  let pairing = "Charred Citrus Highball or Iced Smoky Green Tea";
  let quickSide = "Whipped Garlic-Miso Butter with warm flatbread";
  const ingredients = [];
  const instructions = [];

  let currentSection = "header";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!title && (line.startsWith("#") || line.startsWith("**") || i === 0)) {
      const cleanTitle = line.replace(/^[#*\s]+|[#*\s]+$/g, "").replace(/^Recipe\s*\d*:?\s*/i, "").replace(/^Option\s*\d*:?\s*/i, "");
      if (cleanTitle && !cleanTitle.toLowerCase().includes("ingredient") && !cleanTitle.toLowerCase().includes("instruction")) {
        title = cleanTitle;
        continue;
      }
    }

    const prepMatch = line.match(/(?:Prep\s*Time):\s*([^\n|*]+)/i);
    if (prepMatch) prepTime = prepMatch[1].replace(/[*_]/g, "").trim();

    const cookMatch = line.match(/(?:Cook\s*Time):\s*([^\n|*]+)/i);
    if (cookMatch) cookTime = cookMatch[1].replace(/[*_]/g, "").trim();

    const servMatch = line.match(/(?:Servings|Yield|Portions):\s*([^\n|*]+)/i);
    if (servMatch) servings = servMatch[1].replace(/[*_]/g, "").trim();

    const calMatch = line.match(/(?:Calories|Cal):\s*([^\n|*]+)/i);
    if (calMatch) calories = calMatch[1].replace(/[*_]/g, "").trim();

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

  const techniqueTags = [
    ["Quick Sauté", "High-Heat Sear", "Chef's Pick"],
    ["Comfort Bowl", "Slow Braise", "Umami Rich"],
    ["Crispy Cast-Iron", "Golden Roast", "Smokehouse Classic"],
  ];

  if (!title) {
    const titles = [
      `Artisanal ${originalIngredients.slice(0, 2).map(capitalize).join(" & ")} Sauté`,
      `Comforting ${originalIngredients.slice(0, 2).map(capitalize).join(" & ")} Hearth Bowl`,
      `Cast-Iron Crispy ${originalIngredients.slice(0, 2).map(capitalize).join(" & ")} Roast`,
    ];
    title = titles[fallbackIndex % titles.length];
  }

  if (ingredients.length === 0) {
    if (originalIngredients.length > 0) {
      originalIngredients.forEach((ing) => ingredients.push(`2 cups Fresh ${capitalize(ing)}`));
      ingredients.push("2 tbsp Cultured butter or house olive oil");
      ingredients.push("Pinch of smoked sea salt & freshly cracked pepper");
    } else {
      ingredients.push("200g Core pantry ingredients");
      ingredients.push("2 tbsp House cooking fat & aromatics");
      ingredients.push("Seasoning blend & fresh herbs");
    }
  }

  if (instructions.length === 0) {
    instructions.push("Preheat a heavy cast-iron skillet over medium-high heat with butter or oil.");
    instructions.push("Prep and slice ingredients evenly on a cutting board.");
    instructions.push("Sear undisturbed for 3-4 minutes until deeply browned and aromatic.");
    instructions.push("Season with flaky salt, finish with fresh herbs, and serve hot from the hearth.");
  }

  return {
    id: `recipe-${Date.now()}-${fallbackIndex}-${Math.random().toString(36).substring(2, 6)}`,
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
    chefNote: chefNote || "Finish with a splash of fresh lime or rice vinegar to awaken all rich flavors.",
    tags: techniqueTags[fallbackIndex % techniqueTags.length],
    createdAt: new Date().toISOString(),
    rawText: cleanChunk,
  };
}

/**
 * Parses raw LLM text into an array of Top 3 distinct recipe objects.
 * @param {string} rawText
 * @param {string[]} [originalIngredients=[]]
 * @returns {Array<object>}
 */
export function parseRecipeResponse(rawText, originalIngredients = []) {
  if (!rawText || typeof rawText !== "string") {
    return createFallbackRecipes(originalIngredients);
  }

  let chunks = [];

  if (rawText.includes("---RECIPE_DIVIDER---")) {
    chunks = rawText.split("---RECIPE_DIVIDER---").map((c) => c.trim()).filter(Boolean);
  } else if (rawText.includes("===RECIPE_SPLIT===")) {
    chunks = rawText.split("===RECIPE_SPLIT===").map((c) => c.trim()).filter(Boolean);
  } else {
    // Try splitting by top-level markdown headers like # Recipe 1 or # Title
    const headerSplit = rawText.split(/\n(?=# )/g).map((c) => c.trim()).filter(Boolean);
    if (headerSplit.length >= 2) {
      chunks = headerSplit;
    } else {
      chunks = [rawText];
    }
  }

  const recipes = chunks.map((chunk, idx) => parseSingleRecipeChunk(chunk, originalIngredients, idx));

  // Ensure we always provide 3 distinct recipes
  while (recipes.length < 3) {
    const nextIdx = recipes.length;
    recipes.push(createSingleFallbackRecipe(originalIngredients, nextIdx));
  }

  return recipes.slice(0, 3);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createSingleFallbackRecipe(ingredients = ["Garlic", "Sweet Corn", "Butter"], index = 0) {
  const safeIngs = ingredients.length > 0 ? ingredients : ["Garlic", "Sweet Corn", "Butter"];
  const name1 = capitalize(safeIngs[0] || "Garlic");
  const name2 = capitalize(safeIngs[1] || "Sweet Corn");

  const variations = [
    {
      title: `Smokehouse ${name1} & ${name2} High-Heat Sauté`,
      prepTime: "10 mins",
      cookTime: "12 mins",
      servings: "2 portions",
      calories: "~460 kcal",
      ingredients: [
        ...safeIngs.map((i) => `250g Fresh ${capitalize(i)}`),
        "2 tbsp Cultured butter or olive oil",
        "Pinch of kosher flake sea salt & black pepper",
      ],
      instructions: [
        `Gently slice and prepare your fresh ${name1} and ${name2}.`,
        "Heat a cast-iron skillet over medium-high heat with butter until bubbling.",
        "Sauté aromatics until fragrant and deeply caramelized around the edges.",
        "Toss together, season with sea salt, and serve sizzling hot.",
      ],
      pairing: "Smoky Lemon Iced Green Tea",
      quickSide: "Pickled Cucumber Ribbons with toasted sesame",
      chefNote: "A tiny splash of lime balances the rich butter.",
      tags: ["Quick Sauté", "High-Heat Sear", "Chef's Pick"],
    },
    {
      title: `Comforting ${name1} & ${name2} Hearth Braised Bowl`,
      prepTime: "15 mins",
      cookTime: "20 mins",
      servings: "2 portions",
      calories: "~490 kcal",
      ingredients: [
        ...safeIngs.map((i) => `200g Fresh ${capitalize(i)}`),
        "1.5 cups Savory vegetable or chicken broth",
        "1 tbsp Soy sauce or miso paste",
        "Scallion greens for garnish",
      ],
      instructions: [
        "Lightly toast ingredients in a deep pan with a drizzle of oil.",
        "Pour in warm broth and soy sauce, bringing to a gentle simmer.",
        "Cover and braise on low for 12 minutes to meld flavors into a rich savory jus.",
        "Ladle into warm ceramic bowls and top with fresh scallions.",
      ],
      pairing: "Charred Citrus Highball with mint",
      quickSide: "Whipped Miso Butter with crusty bread",
      chefNote: "Letting the broth simmer slowly draws out maximum umami.",
      tags: ["Comfort Bowl", "Slow Braise", "Umami Rich"],
    },
    {
      title: `Crispy Cast-Iron ${name1} & ${name2} Golden Hash`,
      prepTime: "15 mins",
      cookTime: "18 mins",
      servings: "2-3 portions",
      calories: "~510 kcal",
      ingredients: [
        ...safeIngs.map((i) => `250g Diced ${capitalize(i)}`),
        "2 tbsp High-heat cooking oil or ghee",
        "Smoked sea salt & cracked chili flakes",
      ],
      instructions: [
        "Dice ingredients into uniform bite-sized cubes.",
        "Press firmly into a hot, oiled skillet and leave undisturbed for 5 minutes for a golden crust.",
        "Flip in sections to crisp all sides until deeply crunchy.",
        "Finish with smoked salt and chili flakes right before serving.",
      ],
      pairing: "Ginger-Yuzu Sparkling Tonic",
      quickSide: "Charred Lime Crema Dipping Sauce",
      chefNote: "Do not stir too often; patience creates the crispy crust.",
      tags: ["Crispy Cast-Iron", "Golden Roast", "Smokehouse Classic"],
    },
  ];

  const recipe = variations[index % variations.length];
  return {
    id: `fallback-${Date.now()}-${index}`,
    ...recipe,
    basePortions: 2,
    createdAt: new Date().toISOString(),
    rawText: "Fallback Recipe",
  };
}

export function createFallbackRecipes(ingredients = ["Garlic", "Sweet Corn", "Butter"]) {
  return [
    createSingleFallbackRecipe(ingredients, 0),
    createSingleFallbackRecipe(ingredients, 1),
    createSingleFallbackRecipe(ingredients, 2),
  ];
}
