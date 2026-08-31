import { useState, useRef, useEffect } from "react";
import { PantryWheelModal } from "./PantryWheelModal";
import { getCurrentUser } from "../lib/auth";

const INGREDIENT_COUNT_MODES = [
  { id: "3", label: "3 Items", desc: "Quick Trio" },
  { id: "5", label: "5 Items", desc: "Balanced Meal" },
  { id: "7", label: "7 Items", desc: "Feast Master" },
  { id: "freeform", label: "Freeform Text", desc: "Custom Pantry Box" },
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
  "Heavy Cream",
  "Butter",
  "Rosemary",
];

const PRESETS_BY_COUNT = {
  3: [
    { name: "Smokehouse Corn & Sweet Heat", items: ["Sweet Corn", "Garlic", "Butter"] },
    { name: "Cast-Iron Chicken & Herbs", items: ["Chicken Thighs", "Rosemary", "Shallots"] },
    { name: "Asian Fusion Noodles", items: ["Ramen Noodles", "Gochujang", "Egg"] },
  ],
  5: [
    { name: "Smokehouse Feast", items: ["Chicken Thighs", "Sweet Corn", "Garlic", "Butter", "Charred Lime"] },
    { name: "Garden Pasta Hearth", items: ["Pasta", "Cherry Tomatoes", "Garlic", "Basil", "Olive Oil"] },
    { name: "Umami Mushroom Bowl", items: ["Shiitake Mushrooms", "Jasmine Rice", "Tofu", "Soy Sauce", "Scallions"] },
  ],
  7: [
    { name: "Pitmaster Ultimate Feast", items: ["Chicken Thighs", "Sweet Corn", "Potatoes", "Garlic", "Butter", "Rosemary", "Lime"] },
    { name: "Tokyo Street Sizzle", items: ["Ramen Noodles", "Pork Chops", "Shiitake Mushrooms", "Eggs", "Gochujang", "Scallions", "Sesame Oil"] },
  ],
};

const COOKING_STYLES = [
  "🔥 Smoky Cast-Iron",
  "⚡ 15-Minute Flash Meal",
  "🍲 Comforting Braise",
  "🌿 Fresh & Vibrant",
  "🌶️ Bold & Spicy",
];

export function IngredientForm({ onSubmit, isLoading, initialIngredients }) {
  const [mode, setMode] = useState("3"); // '3' | '5' | '7' | 'freeform'
  const [slots, setSlots] = useState(["", "", ""]);
  const [freeformText, setFreeformText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(COOKING_STYLES[0]);
  const [dietaryNote, setDietaryNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);

  // Sync initialIngredients if passed
  useEffect(() => {
    if (initialIngredients && Array.isArray(initialIngredients) && initialIngredients.length > 0) {
      setSlots(initialIngredients);
      if (initialIngredients.length > 5) setMode("7");
      else if (initialIngredients.length > 3) setMode("5");
      else setMode("3");
    }
  }, [initialIngredients]);

  // Adjust slots when switching mode
  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === "3") {
      setSlots((prev) => (prev.length >= 3 ? prev.slice(0, 3) : [...prev, ...Array(3 - prev.length).fill("")]));
    } else if (newMode === "5") {
      setSlots((prev) => (prev.length >= 5 ? prev.slice(0, 5) : [...prev, ...Array(5 - prev.length).fill("")]));
    } else if (newMode === "7") {
      setSlots((prev) => (prev.length >= 7 ? prev.slice(0, 7) : [...prev, ...Array(7 - prev.length).fill("")]));
    } else if (newMode === "freeform") {
      const existing = slots.filter(Boolean).join(", ");
      if (existing && !freeformText) setFreeformText(existing);
    }
  }

  function handleSlotChange(index, value) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addSlot() {
    setSlots((prev) => [...prev, ""]);
  }

  function removeSlot(index) {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();

    let list = [];
    if (mode === "freeform") {
      list = freeformText.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    } else {
      list = slots.map((s) => s.trim()).filter(Boolean);
    }

    if (list.length === 0 && !imagePreview) return;

    const stylePrompt = selectedStyle ? ` Prepared with a ${selectedStyle.replace(/^[^\w]+/, "")} technique.` : "";
    let notePrompt = dietaryNote.trim() ? ` Dietary note: ${dietaryNote.trim()}.` : "";
    const user = getCurrentUser();
    if (user?.dietaryPreferences?.length > 0) {
      notePrompt += ` Strict dietary preferences: ${user.dietaryPreferences.join(", ")}. Spice level preference: ${user.spicePreference || "Medium"}.`;
    }

    const question = imagePreview && list.length === 0
      ? `Identify the best food ingredients in this photo and create 3 distinct elevated recipes.${stylePrompt}${notePrompt}`
      : `Create 3 distinct elevated recipes using these pantry ingredients: ${list.join(", ")}.${stylePrompt}${notePrompt} Include prep & cook time, full ingredients list with portions, step-by-step instructions, craft beverage pairing, and pitmaster tasting notes.`;

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
      alert("Voice recognition is not supported in this browser. Try Chrome or Safari.");
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
        const parts = transcript
          .replace(/I have|I've got|and|with|some/gi, ",")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (mode === "freeform") {
          setFreeformText(parts.join(", "));
        } else {
          setSlots(parts.slice(0, slots.length));
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech error:", err);
      setIsListening(false);
    }
  }

  function applyPreset(preset) {
    setSlots(preset.items);
    if (preset.items.length === 3) setMode("3");
    else if (preset.items.length === 5) setMode("5");
    else if (preset.items.length === 7) setMode("7");
    setImagePreview(null);
  }

  function applyMysteryCombo(items) {
    setSlots(items);
    setMode("3");
    setImagePreview(null);
  }

  function addIngredientToNextSlot(item) {
    if (mode === "freeform") {
      setFreeformText((prev) => (prev ? `${prev}, ${item}` : item));
      return;
    }

    const emptyIndex = slots.findIndex((s) => !s.trim());
    if (emptyIndex !== -1) {
      handleSlotChange(emptyIndex, item);
    } else {
      setSlots((prev) => [...prev, item]);
    }
  }

  function clearAll() {
    setSlots(Array(parseInt(mode, 10) || 3).fill(""));
    setFreeformText("");
    setDietaryNote("");
    setImagePreview(null);
  }

  const currentPresets = PRESETS_BY_COUNT[parseInt(mode, 10)] || PRESETS_BY_COUNT[3];
  const hasAnyInput = Boolean(slots.some((s) => s.trim()) || freeformText.trim() || imagePreview);

  return (
    <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro p-6 sm:p-8 relative">
      {/* Header with Step Indicator & Action Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#EDE3D3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#636951]/15 text-[#636951] text-xs font-typewriter font-bold uppercase tracking-wider">
              Step 01 • Pantry Input
            </span>
            <span className="text-[#636951] text-xs hidden sm:inline">•</span>
            <span className="text-xs text-[#334D66]/70 hidden sm:inline">Mise en place for every kitchen</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#334D66] mt-1">
            Choose Your Pantry Ingredients
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

      {/* Ingredient Count Mode Tabs: 3 Items, 5 Items, 7 Items, Freeform */}
      <div className="pt-6 pb-2">
        <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase mb-2">
          Pantry Quantity Mode:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INGREDIENT_COUNT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModeChange(m.id)}
              className={`p-2.5 rounded-loro border text-left transition-all ${
                mode === m.id
                  ? "bg-[#334D66] text-[#FBF0DF] border-[#334D66] shadow-sm"
                  : "bg-white text-[#334D66] border-[#EDE3D3] hover:bg-[#FBF0DF]"
              }`}
            >
              <div className="font-bold text-xs">{m.label}</div>
              <div className={`text-[10px] font-typewriter ${mode === m.id ? "text-[#FFBDA6]" : "text-[#636951]"}`}>
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Preview Banner */}
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
                AI Vision will scan your items or augment the slots below.
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
        {/* Slot-based input OR Freeform Box */}
        {mode === "freeform" ? (
          <div className="space-y-1.5">
            <label className="block text-xs font-typewriter font-bold tracking-wider text-[#334D66] uppercase">
              Freeform Pantry Text Box (Paste or Type What You Have)
            </label>
            <textarea
              rows={4}
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder="e.g. Chicken thighs, sweet corn, garlic cloves, heavy cream, parmesan, fresh basil, cracked pepper"
              disabled={isLoading}
              className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-[#334D66] placeholder-[#8EA4B8] text-sm font-medium rounded-lg p-4 outline-none transition-all leading-relaxed"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {slots.map((val, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="block text-[11px] font-typewriter font-bold text-[#334D66] uppercase">
                    Slot {idx + 1}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleSlotChange(idx, e.target.value)}
                      placeholder={`e.g. ${idx === 0 ? "Chicken / Tofu" : idx === 1 ? "Sweet Corn / Veg" : "Garlic / Butter"}`}
                      disabled={isLoading}
                      className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-[#334D66] placeholder-[#8EA4B8] text-sm font-medium rounded-lg px-3.5 py-2.5 outline-none transition-all pr-8"
                    />
                    {val && (
                      <button
                        type="button"
                        onClick={() => handleSlotChange(idx, "")}
                        className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add extra slot button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSlot}
                className="text-xs font-typewriter font-bold text-[#334D66] hover:text-[#E56960] flex items-center gap-1"
              >
                + Add Another Ingredient Slot
              </button>
            </div>
          </div>
        )}

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
              <span>✨</span> Curated Smokehouse Flavor Combinations
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {currentPresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={isLoading}
                className="text-left p-3 rounded-lg bg-white border border-[#EDE3D3] hover:border-[#E56960] hover:shadow-loro-sm transition-all group"
              >
                <div className="text-xs font-bold text-[#334D66] group-hover:text-[#E56960] line-clamp-1 mb-1">
                  {preset.name}
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
            Culinary Technique / Style
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

        {/* Submit CTA Button */}
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
                  STOKING THE HEARTH & CRAFTING TOP 3 FEASTS...
                </span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>Generate Top 3 Artisanal Recipes</span>
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
