import { useState, useRef, useEffect } from "react";
import { PantryWheelModal } from "./PantryWheelModal";

const PANTRY_PRESETS = [
  {
    name: "Smokehouse Corn & Sweet Heat",
    badge: "Chef's Pick",
    items: ["Sweet Corn", "Garlic", "Butter"],
  },
  {
    name: "Cast-Iron Chicken & Herbs",
    badge: "High Protein",
    items: ["Chicken Thighs", "Rosemary", "Shallots"],
  },
  {
    name: "Asian Fusion Noodles",
    badge: "15-Min Fast",
    items: ["Ramen Noodles", "Gochujang", "Egg"],
  },
  {
    name: "Hearth Garlic Tomato Sauté",
    badge: "Plant-Forward",
    items: ["Cherry Tomatoes", "Garlic", "Basil"],
  },
];

const POPULAR_INGREDIENTS = [
  "Garlic",
  "Sweet Corn",
  "Chicken Thighs",
  "Eggs",
  "Cherry Tomatoes",
  "Rice",
  "Mushrooms",
  "Scallions",
  "Soy Sauce",
  "Tofu",
  "Pasta",
  "Potatoes",
  "Lime",
  "Avocado",
];

const COOKING_STYLES = [
  "🔥 Smoky Cast-Iron",
  "⚡ 15-Minute Flash Meal",
  "🍲 Comforting Braise",
  "🌿 Fresh & Vibrant",
  "🌶️ Bold & Spicy",
];

export function IngredientForm({ onSubmit, isLoading, initialIngredients }) {
  const [ing1, setIng1] = useState("");
  const [ing2, setIng2] = useState("");
  const [ing3, setIng3] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(COOKING_STYLES[0]);
  const [dietaryNote, setDietaryNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialIngredients && Array.isArray(initialIngredients)) {
      if (initialIngredients[0]) setIng1(initialIngredients[0]);
      if (initialIngredients[1]) setIng2(initialIngredients[1]);
      if (initialIngredients[2]) setIng3(initialIngredients[2]);
    }
  }, [initialIngredients]);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const clean1 = ing1.trim();
    const clean2 = ing2.trim();
    const clean3 = ing3.trim();

    if (!clean1 && !clean2 && !clean3 && !imagePreview) return;

    const list = [clean1, clean2, clean3].filter(Boolean);
    const stylePrompt = selectedStyle ? ` Prepared with a ${selectedStyle.replace(/^[^\w]+/, "")} style.` : "";
    const notePrompt = dietaryNote.trim() ? ` Dietary note: ${dietaryNote.trim()}.` : "";

    const question = imagePreview && list.length === 0
      ? `Look at this photo of my fridge/pantry. Identify the 3 best ingredients visible and create an elevated, delicious recipe with them.${stylePrompt}${notePrompt}`
      : `Create an elevated, delicious recipe using these 3 ingredients: ${list.join(", ")}.${stylePrompt}${notePrompt} Include dish title, prep & cook time, full ingredients list with portions, step-by-step instructions, craft beverage pairing, and chef's tasting note.`;

    onSubmit({
      question,
      ingredients: list,
      image: imagePreview,
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Clean words and split by commas, "and", or spaces
        const parts = transcript
          .replace(/I have|I've got|and|with|some/gi, ",")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (parts[0]) setIng1(parts[0]);
        if (parts[1]) setIng2(parts[1]);
        if (parts[2]) setIng3(parts[2]);
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech error:", err);
      setIsListening(false);
    }
  }

  function applyPreset(preset) {
    setIng1(preset.items[0] || "");
    setIng2(preset.items[1] || "");
    setIng3(preset.items[2] || "");
    setImagePreview(null);
  }

  function applyMysteryCombo(items) {
    setIng1(items[0] || "");
    setIng2(items[1] || "");
    setIng3(items[2] || "");
    setImagePreview(null);
  }

  function addIngredientToNextSlot(item) {
    if (!ing1) setIng1(item);
    else if (!ing2) setIng2(item);
    else if (!ing3) setIng3(item);
    else setIng1(item);
  }

  function clearAll() {
    setIng1("");
    setIng2("");
    setIng3("");
    setDietaryNote("");
    setImagePreview(null);
  }

  const hasAnyInput = Boolean(ing1.trim() || ing2.trim() || ing3.trim() || imagePreview);

  return (
    <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro p-6 sm:p-8 relative">
      {/* Header with Step indicator and Feature Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#EDE3D3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#636951]/15 text-[#636951] text-xs font-typewriter font-bold uppercase tracking-wider">
              Step 01 • Pantry Input
            </span>
            <span className="text-[#636951] text-xs hidden sm:inline">•</span>
            <span className="text-xs text-[#334D66]/70 hidden sm:inline">Zero food waste</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#334D66] mt-1">
            Choose Your 3 Ingredients
          </h2>
        </div>

        {/* Action Shortcuts: Voice, Photo, Mystery Wheel */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice input */}
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`px-3 py-1.5 rounded-lg text-xs font-typewriter font-bold border transition-all flex items-center gap-1.5 ${
              isListening
                ? "bg-[#E56960] text-white border-[#E56960] animate-pulse"
                : "bg-white text-[#334D66] border-[#EDE3D3] hover:bg-[#FBF0DF]"
            }`}
            title="Speak your ingredients"
          >
            <span>🎤 {isListening ? "Listening..." : "Dictate"}</span>
          </button>

          {/* Photo upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-lg text-xs font-typewriter font-bold border transition-all flex items-center gap-1.5 ${
              imagePreview
                ? "bg-[#636951] text-white border-[#636951]"
                : "bg-white text-[#334D66] border-[#EDE3D3] hover:bg-[#FBF0DF]"
            }`}
            title="Upload photo of your fridge"
          >
            <span>📸 {imagePreview ? "Photo Added" : "Snap Fridge"}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Mystery Wheel */}
          <button
            type="button"
            onClick={() => setShowWheelModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-typewriter font-bold bg-[#EDE3D3] hover:bg-[#e0d3c0] text-[#334D66] border border-[#EDE3D3] transition-all flex items-center gap-1.5"
            title="Randomize ingredients with Mystery Wheel"
          >
            <span>🎰 Mystery Wheel</span>
          </button>
        </div>
      </div>

      {/* Photo Preview Banner (if photo uploaded) */}
      {imagePreview && (
        <div className="mt-4 p-3 bg-[#FBF0DF] border border-[#EDE3D3] rounded-loro flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Fridge Preview"
              className="w-14 h-14 object-cover rounded-md border border-[#EDE3D3]"
            />
            <div>
              <span className="text-xs font-typewriter font-bold text-[#E56960] uppercase">
                📸 Fridge Photo Loaded
              </span>
              <p className="text-xs text-[#636951]">
                AI Vision will scan your image or refine with the 3 slots below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="text-xs text-[#E56960] hover:underline font-typewriter font-bold"
          >
            Remove
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* 3 Ingredient Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ingredient 1 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase">
              <span className="inline-block w-5 h-5 rounded-full bg-[#334D66] text-[#FBF0DF] text-center leading-5 text-[11px] mr-1.5">
                1
              </span>
              Main Protein / Base
            </label>
            <div className="relative">
              <input
                type="text"
                value={ing1}
                onChange={(e) => setIng1(e.target.value)}
                placeholder="e.g. Chicken, Sweet Corn, Pasta"
                disabled={isLoading}
                className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-[#334D66] placeholder-[#8EA4B8] text-sm font-medium rounded-lg px-4 py-3 outline-none transition-all"
              />
              {ing1 && (
                <button
                  type="button"
                  onClick={() => setIng1("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Ingredient 2 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase">
              <span className="inline-block w-5 h-5 rounded-full bg-[#334D66] text-[#FBF0DF] text-center leading-5 text-[11px] mr-1.5">
                2
              </span>
              Fresh Produce / Veg
            </label>
            <div className="relative">
              <input
                type="text"
                value={ing2}
                onChange={(e) => setIng2(e.target.value)}
                placeholder="e.g. Garlic, Shallots, Mushrooms"
                disabled={isLoading}
                className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-[#334D66] placeholder-[#8EA4B8] text-sm font-medium rounded-lg px-4 py-3 outline-none transition-all"
              />
              {ing2 && (
                <button
                  type="button"
                  onClick={() => setIng2("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Ingredient 3 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase">
              <span className="inline-block w-5 h-5 rounded-full bg-[#334D66] text-[#FBF0DF] text-center leading-5 text-[11px] mr-1.5">
                3
              </span>
              Pantry Accent / Sauce
            </label>
            <div className="relative">
              <input
                type="text"
                value={ing3}
                onChange={(e) => setIng3(e.target.value)}
                placeholder="e.g. Butter, Gochujang, Soy Sauce"
                disabled={isLoading}
                className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-[#334D66] placeholder-[#8EA4B8] text-sm font-medium rounded-lg px-4 py-3 outline-none transition-all"
              />
              {ing3 && (
                <button
                  type="button"
                  onClick={() => setIng3("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-typewriter font-bold text-[#636951] uppercase tracking-wider">
              Quick Add From Pantry:
            </span>
            {hasAnyInput && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-typewriter text-[#636951] hover:text-[#E56960] transition-colors underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_INGREDIENTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addIngredientToNextSlot(item)}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs font-medium bg-[#FBF0DF] hover:bg-[#E56960] hover:text-white text-[#334D66] border border-[#EDE3D3] rounded-md transition-all active:scale-95"
              >
                + {item}
              </button>
            ))}
          </div>
        </div>

        {/* Smokehouse Curated Combos */}
        <div className="bg-[#FBF0DF]/70 rounded-loro p-4 border border-[#EDE3D3]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-typewriter font-bold text-[#334D66] uppercase tracking-wider flex items-center gap-1.5">
              <span>✨</span> Curated Smokehouse Combinations
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PANTRY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={isLoading}
                className="text-left p-3 rounded-lg bg-white border border-[#EDE3D3] hover:border-[#E56960] hover:shadow-loro-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-[#334D66] group-hover:text-[#E56960] line-clamp-1">
                    {preset.name}
                  </span>
                </div>
                <div className="text-[11px] text-[#636951] font-medium font-typewriter truncate">
                  {preset.items.join(" • ")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cooking Style Options */}
        <div>
          <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase mb-2">
            Culinary Vibe / Technique
          </label>
          <div className="flex flex-wrap gap-2">
            {COOKING_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setSelectedStyle(style)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  selectedStyle === style
                    ? "bg-[#334D66] text-[#FBF0DF] border-[#334D66] shadow-sm"
                    : "bg-white text-[#334D66] border-[#EDE3D3] hover:bg-[#FBF0DF]"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-[#636951] hover:text-[#334D66] flex items-center gap-1.5"
          >
            <span>{showAdvanced ? "▼" : "▶"}</span>
            <span>Custom Chef Notes & Dietary Preferences</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-[#FBF0DF]/60 rounded-lg border border-[#EDE3D3]">
              <label className="block text-xs font-typewriter text-[#334D66] mb-1 font-semibold">
                Special instructions (e.g. gluten-free, extra spicy, kid-friendly, under 500 calories)
              </label>
              <input
                type="text"
                value={dietaryNote}
                onChange={(e) => setDietaryNote(e.target.value)}
                placeholder="e.g. Make it spicy with a crispy texture, dairy-free"
                className="w-full bg-white border border-[#EDE3D3] rounded-md px-3 py-2 text-sm text-[#334D66] outline-none focus:border-[#E56960]"
              />
            </div>
          )}
        </div>

        {/* Submit CTA Button - Loro style */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !hasAnyInput}
            className={`w-full py-4 px-6 rounded-loro font-bold text-base uppercase tracking-wider text-white shadow-loro-coral btn-shimmer transition-all flex items-center justify-center gap-3 ${
              isLoading || !hasAnyInput
                ? "bg-[#334D66]/40 cursor-not-allowed"
                : "bg-[#E56960] hover:bg-[#C94F46] active:scale-[0.99] cursor-pointer"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <span className="flex gap-1.5">
                  <span className="simmer-dot" />
                  <span className="simmer-dot" />
                  <span className="simmer-dot" />
                </span>
                <span className="font-typewriter text-sm tracking-widest text-[#FBF0DF]">
                  STOKING THE HEARTH & CRAFTING RECIPE...
                </span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Generate Artisanal Feast</span>
                <span className="text-xs font-typewriter opacity-80 lowercase font-normal">
                  (instant AI cook)
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Mystery Pantry Wheel Modal */}
      {showWheelModal && (
        <PantryWheelModal
          onSelectCombo={applyMysteryCombo}
          onClose={() => setShowWheelModal(false)}
        />
      )}
    </div>
  );
}
