import { getIngredientSubstitutes } from "../lib/parseRecipes";

export function SmartSwapModal({ ingredient, onSelectSwap, onClose }) {
  if (!ingredient) return null;

  const substitutes = getIngredientSubstitutes(ingredient);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro-lg max-w-md w-full p-6 space-y-6 animate-toast-enter">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EDE3D3] pb-4">
          <div>
            <span className="text-xs font-typewriter font-bold uppercase tracking-wider text-[#E56960] flex items-center gap-1.5">
              <span>🔄</span> Smart Pantry Swap
            </span>
            <h3 className="font-display text-2xl text-[#334D66] mt-1">
              Substitutes for:
            </h3>
            <p className="text-sm font-typewriter font-bold text-[#636951] truncate mt-0.5">
              "{ingredient}"
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#334D66] text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Substitutes List */}
        <div className="space-y-3">
          <p className="text-xs font-serif text-[#636951]">
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
                className="w-full text-left p-3.5 rounded-loro border border-[#EDE3D3] hover:border-[#E56960] hover:bg-[#FBF0DF]/60 bg-white transition-all group flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[#334D66] group-hover:text-[#E56960] transition-colors">
                    {sub.name}
                  </div>
                  <div className="text-xs text-[#636951] font-serif">
                    {sub.note}
                  </div>
                </div>
                <span className="text-xs font-typewriter font-bold text-[#E56960] opacity-0 group-hover:opacity-100 transition-opacity">
                  Use This →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom replacement input */}
        <div className="pt-2 border-t border-[#EDE3D3] flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-typewriter text-[#636951] hover:text-[#334D66] underline"
          >
            Keep original ingredient
          </button>
        </div>
      </div>
    </div>
  );
}
