import { useState } from "react";
import { getCurrentUser, updateTastePreferences } from "../lib/auth";

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "Nut-Free",
  "High Protein",
  "Low Carb / Keto",
  "Under 500 kcal",
  "Pescatarian",
  "Kid-Friendly",
];

const SPICE_LEVELS = [
  "Mild & Gentle",
  "Medium Balanced",
  "Bold & Smoky Heat",
  "Fiery Ghost Pepper",
];

const STAPLE_SUGGESTIONS = [
  "Cultured Butter",
  "Olive Oil",
  "Garlic",
  "Smoked Sea Salt",
  "Black Pepper",
  "Soy Sauce",
  "Gochujang",
  "Chili Crisp",
  "Fresh Rosemary",
  "Parmesan",
  "Lemon / Lime",
  "Sesame Oil",
];

export function TasteProfileModal({ isOpen, onClose, onSave }) {
  const currentUser = getCurrentUser();
  const [selectedDiets, setSelectedDiets] = useState(currentUser?.dietaryPreferences || []);
  const [spice, setSpice] = useState(currentUser?.spicePreference || "Medium Balanced");
  const [staples, setStaples] = useState(currentUser?.kitchenStaples || ["Olive Oil", "Garlic", "Butter", "Flake Salt"]);
  const [newStaple, setNewStaple] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  function toggleDiet(diet) {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  }

  function addStaple(item) {
    if (!item || staples.includes(item)) return;
    setStaples((prev) => [...prev, item]);
    setNewStaple("");
  }

  function removeStaple(item) {
    setStaples((prev) => prev.filter((s) => s !== item));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateTastePreferences({
        dietaryPreferences: selectedDiets,
        spicePreference: spice,
        kitchenStaples: staples,
      });
      if (onSave) onSave(updated);
      onClose();
    } catch (err) {
      console.error("Save preferences error:", err);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="editorial-modal-backdrop fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="editorial-modal taste-dialog bg-[#FFF8EC] rounded-loro-lg border border-[#E3CFB1] shadow-loro-lg max-w-lg w-full p-6 sm:p-8 space-y-6 animate-toast-enter max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3CFB1] pb-4">
          <div>
            <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#F2382F]">
              Personalized Taste Profile
            </span>
            <h3 className="font-display text-2xl text-[#201B17]">
              Chef Taste & Dietary Notes
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#201B17] text-base p-1">
            ✕
          </button>
        </div>

        {/* Dietary Preferences */}
        <div className="space-y-2">
          <label className="block text-xs font-typewriter font-bold text-[#201B17] uppercase">
            Dietary Preferences & Health Goals:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map((d) => {
              const active = selectedDiets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiet(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-[#F2382F] text-white border-[#F2382F] shadow-sm"
                      : "bg-[#F5E6CC] text-[#201B17] border-[#E3CFB1] hover:bg-[#E3CFB1]"
                  }`}
                >
                  {active ? "✓ " : "+ "}
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spice Level */}
        <div className="space-y-2">
          <label className="block text-xs font-typewriter font-bold text-[#201B17] uppercase">
            Preferred Spice Level:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SPICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSpice(level)}
                className={`p-2.5 rounded-loro text-xs font-typewriter font-bold text-left border transition-all ${
                  spice === level
                    ? "bg-[#201B17] text-[#F5E6CC] border-[#201B17] shadow-sm"
                    : "bg-white text-[#201B17] border-[#E3CFB1] hover:bg-[#F5E6CC]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Permanent Kitchen Staples */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-typewriter font-bold text-[#201B17] uppercase">
              Permanent Kitchen Staples:
            </label>
            <span className="text-[10px] font-typewriter text-[#6D5545]">
              Always in your pantry
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 bg-[#F5E6CC] rounded-loro border border-[#E3CFB1]">
            {staples.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1.5 bg-white text-[#201B17] px-2.5 py-1 rounded-md text-xs font-medium border border-[#E3CFB1]"
              >
                <span>{st}</span>
                <button
                  type="button"
                  onClick={() => removeStaple(st)}
                  className="text-gray-400 hover:text-[#F2382F] text-xs font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          {/* Add custom staple */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStaple}
              onChange={(e) => setNewStaple(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStaple(newStaple.trim()); } }}
              placeholder="Add staple (e.g. Miso paste, Honey)"
              className="flex-1 bg-white border border-[#E3CFB1] rounded-md px-3 py-1.5 text-xs text-[#201B17] outline-none focus:border-[#F2382F]"
            />
            <button
              type="button"
              onClick={() => addStaple(newStaple.trim())}
              className="px-3 py-1.5 rounded-md bg-[#201B17] text-[#F5E6CC] text-xs font-typewriter font-bold uppercase"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {STAPLE_SUGGESTIONS.filter((s) => !staples.includes(s)).slice(0, 5).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addStaple(s)}
                className="text-[10px] font-typewriter text-[#6D5545] hover:text-[#F2382F] bg-white border border-[#E3CFB1] px-2 py-0.5 rounded"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 border-t border-[#E3CFB1]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 px-4 rounded-loro font-bold text-xs uppercase tracking-wider text-white bg-[#F2382F] hover:bg-[#CF2A23] shadow-loro-coral btn-shimmer transition-all"
          >
            {saving ? "SAVING PREFERENCES..." : "Save Taste Profile →"}
          </button>
        </div>
      </div>
    </div>
  );
}
