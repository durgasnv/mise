import { getIngredientSubstitutes } from "../lib/parseRecipes";

export function SmartSwapModal({ ingredient, onSelectSwap, onClose }) {
  if (!ingredient) return null;

  const substitutes = getIngredientSubstitutes(ingredient);

  return (
    <div className="editorial-modal-backdrop fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="editorial-modal swap-dialog bg-[#FFF8EC] rounded-loro-lg border border-[#E3CFB1] shadow-loro-lg max-w-md w-full p-6 space-y-6 animate-toast-enter">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E3CFB1] pb-4">
          <div>
            <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#F2382F] flex items-center gap-1.5">
              <span>🔄</span> Smart Pantry Swap
            </span>
            <h3 className="font-display text-2xl text-[#201B17] mt-1">
              Substitutes for:
            </h3>
            <p className="text-sm font-typewriter font-bold text-[#6D5545] truncate mt-0.5">
              "{ingredient}"
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#201B17] text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Substitutes List */}
        <div className="space-y-3">
          <p className="text-xs font-serif text-[#6D5545]">
            Out of this item? Choose a chef-recommended swap to update your recipe:
          </p>

          <div className="space-y-2.5">
            {substitutes.map((sub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectSwap(sub.name);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-loro border border-[#E3CFB1] hover:border-[#F2382F] hover:bg-[#F5E6CC]/60 bg-white transition-all group flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[#201B17] group-hover:text-[#F2382F] transition-colors">
                    {sub.name}
                  </div>
                  <div className="text-xs text-[#6D5545] font-serif">
                    {sub.note}
                  </div>
                </div>
                <span className="text-xs font-typewriter font-bold text-[#F2382F] opacity-0 group-hover:opacity-100 transition-opacity">
                  Use This →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom replacement input */}
        <div className="pt-2 border-t border-[#E3CFB1] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-typewriter text-[#6D5545] hover:text-[#201B17] underline"
          >
            Keep original ingredient
          </button>
        </div>
      </div>
    </div>
  );
}
