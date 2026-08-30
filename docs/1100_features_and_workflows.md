# 1100 • Features & Culinary Workflows

## Overview of System Features

Mise is packed with 12 interconnected culinary tools designed to guide users from their open fridge all the way to plating their meal.

---

## 1. 🎛️ Flexible Pantry Quantities & Freeform Input

Users can customize the exact quantity of ingredients they want to cook with:
* **`3 Items` (Quick Trio)**: High-speed cooking using a protein, produce, and cooking fat/sauce.
* **`5 Items` (Balanced Kitchen)**: Full dinner balancing proteins, vegetables, starches, and aromatics.
* **`7 Items` (Feast Master)**: Multi-component feasts with sauces, marinades, and textures.
* **`Freeform Text Box`**: Allows users to paste or dictate an unformatted list of ingredients (*e.g., "leftover roast chicken, sweet corn, garlic, heavy cream, parmesan, fresh basil"*).
* **`+ Add / ✕ Remove Slot`**: Dynamically add or delete ingredient input slots.

---

## 2. 🃏 Top 3 Stacked Recipe Deck

Rather than forcing a single recipe, Mise outputs **3 distinct culinary styles** for the provided ingredients:
1. **Option 1: Quick Sauté / High-Heat Sear** — Fast weeknight cooking (10-15 mins).
2. **Option 2: Comforting Hearth Braised Bowl / Soup** — Deeply savory, slow-simmered flavors.
3. **Option 3: Crispy Cast-Iron / Oven Roast** — Golden textures, crispy skins, and roasted caramelization.

**Stacked Deck Interface**:
* Visually layered cards arranged one behind the other with offset depth shadows (`scale-[0.98]` and `scale-[0.96]`).
* Clicking any background card or top tab instantly brings it to the front with smooth animation.

---

## 3. ⏱️ Interactive Hands-Free Cooking Mode

Built for standing over a sizzling pan with flour on your hands:
* **Giant Readable Typography**: Clear, high-contrast serif and monospace fonts readable from 5 feet away.
* **Smart Auto-Timers**: Parses text like *"Sear undisturbed for 3 minutes"* into a 1-click countdown timer with `+1m` / `+3m` extensions.
* **Harmonic Dinner Bell Chime**: Uses the browser **Web Audio API** oscillator synthesis (523.25 Hz - 1046.5 Hz) to ring an authentic, warm brass dinner bell when timers finish.
* **Voice Step Reader**: Leverages the browser **Web Speech API** to read instruction steps aloud.
* **Keyboard Navigation**: Press `Arrow Left / Right` to change steps and `Spacebar` to toggle timers.

---

## 4. 🧑‍🍳 Authentication & 1-Click Fast Demo Profile

* **Built-in JWT + MongoDB Authentication**: Secure password hashing with `bcryptjs` and session tokens stored in `localStorage`.
* **⚡ 1-Click Fast Demo Login (`Chef Durga`)**: Instantly logs in with pre-configured taste preferences and cloud cookbook access without typing credentials (ideal for hackathon judging).
* **Automatic Guest Sync**: Any recipes saved locally prior to login are automatically migrated to the user's permanent cloud profile.

---

## 5. 🎯 Personalized Taste & Dietary Profile

Users can configure their kitchen profile once and Mise applies it automatically to every recipe generated:
* **Dietary Restrictions**: *Vegetarian, Vegan, Gluten-Free, Dairy-Free, Halal, Kosher, Nut-Free, High Protein, Low Carb / Keto, Under 500 kcal, Pescatarian, Kid-Friendly*.
* **Spice Level**: *Mild & Gentle, Medium Balanced, Bold & Smoky Heat, Fiery Ghost Pepper*.
* **Permanent Kitchen Staples**: Saves household pantry basics (*olive oil, butter, garlic confit, flake salt, gochujang, chili crisp*) so users don't have to re-enter them.

---

## 6. 📸 "Snap Your Fridge" (AI Vision Scanner)

* Users can upload an image or snap a photo directly from their camera.
* Uses **Groq Vision (`llama-3.2-11b-vision-preview`)** to detect visible ingredients and automatically formulate recipes without manual typing.

---

## 7. 🎰 "Mystery Pantry Wheel" (Culinary Roulette Challenge)

* Interactive 3-slot spinning reel game:
  - **Reel 1**: Base Proteins & Grains (*Chicken Thighs, Firm Tofu, Salmon Fillet, Ramen Noodles, Jasmine Rice*)
  - **Reel 2**: Fresh Produce & Veggies (*Sweet Corn, Shiitake Mushrooms, Shallots, Bok Choy, Charred Lime*)
  - **Reel 3**: Flavor Accents & Sauces (*Gochujang, Cultured Butter, Chili Crisp, Miso Paste, Rosemary*)
* Click **`🎲 Spin Again`** or **`🔥 Cook This Feast`** to instantly populate the kitchen workbench.

---

## 8. ⚖️ Dynamic Portion Scaler

* Switch between **`1x`**, **`2x`**, **`4x`**, **`6x`**, or **`8x`** servings.
* Dynamically recalculates fractions (*e.g., 1/2 cup -> 1 cup*), decimal measurements, and metric weights in real time.

---

## 9. 🔄 "Smart Swap" 1-Click Ingredient Substitutions

* Click the **`🔄 Swap`** button next to any ingredient.
* Displays 3 chef-curated replacements with replacement ratios (*e.g., swapping Butter for Olive Oil 1:1, or Gochujang for Sriracha + Miso*).
* 1-click replaces the ingredient directly in the active recipe card.

---

## 10. 🍸 Smokehouse Beverage & Companion Side Pairings

* Recommends a craft drink pairing (*e.g., Charred Citrus Highball or Smoky Iced Jasmine Tea*).
* Recommends a quick 2-ingredient companion side dish (*e.g., Whipped Garlic-Miso Butter with warm flatbread*).

---

## 11. 📸 Vintage Menu Postcard Exporter (Social Share)

* Uses **HTML5 Canvas** to render a high-resolution, restaurant-style printable menu card with decorative borders, ingredients, and pairings.
* 1-click **PNG Download** and native **Web Share API** integration.

---

## 12. 📖 Cookbook & Recipe Library

* Search saved recipes by name or filter by tags (*Quick Sauté, Comfort Bowl, Cast Iron, High Protein*).
* Interactive checkbox step completion and undo-delete toast recovery.
