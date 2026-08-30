import { useState, useEffect } from "react";
import { getSavedRecipes } from "../lib/savedRecipes";

export function Navbar({ currentView, onNavigate, onOpenMysteryWheel, onOpenDemoCookingMode }) {
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    function updateCount() {
      const list = getSavedRecipes();
      setSavedCount(list.length);
    }
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, [currentView]);

  return (
    <header className="sticky top-0 z-40 bg-[#FBF0DF]/95 backdrop-blur-md border-b border-[#EDE3D3] transition-all">
      {/* Top feature banner ribbon */}
      <div className="bg-[#334D66] text-[#FBF0DF] text-[11px] font-medium tracking-wider uppercase py-1.5 px-4 text-center flex items-center justify-center gap-4 flex-wrap">
        <span>🔥 AI Smokehouse Studio</span>
        <span className="opacity-40">•</span>
        <span>📸 AI Fridge Vision</span>
        <span className="opacity-40">•</span>
        <span>🎰 Mystery Wheel</span>
        <span className="opacity-40">•</span>
        <span>⏱️ Hands-Free Cooking Mode</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Loro inspired */}
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-[#E56960] flex items-center justify-center text-white font-bold text-xl shadow-loro-coral group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" stroke="currentColor" strokeWidth="0.5">
                <circle cx="12" cy="14" r="5" fill="#FBF0DF" />
                <path d="M12 4v3M4.93 6.93l2.12 2.12M2 14h3M4.93 21.07l2.12-2.12M19.07 6.93l-2.12 2.12M22 14h-3M19.07 21.07l-2.12-2.12" stroke="#FBF0DF" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <span className="font-display text-2xl sm:text-3xl text-[#334D66] tracking-tight group-hover:text-[#E56960] transition-colors leading-none block">
                FRIDGE<span className="text-[#E56960]">2</span>FEAST
              </span>
              <span className="text-[10px] font-typewriter tracking-widest text-[#636951] uppercase block mt-0.5">
                Asian Smokehouse & Artisanal AI Kitchen
              </span>
            </div>
          </button>

          {/* Navigation Links with Action Buttons */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate("ask")}
              className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                currentView === "ask"
                  ? "bg-[#334D66] text-[#FBF0DF] shadow-loro font-bold"
                  : "text-[#334D66] hover:bg-[#EDE3D3]/70 font-medium"
              }`}
            >
              <span>🍳 The Kitchen</span>
            </button>

            {/* Mystery Wheel button */}
            <button
              onClick={onOpenMysteryWheel}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-typewriter font-bold rounded-md bg-[#EDE3D3] hover:bg-[#e0d3c0] text-[#334D66] transition-all"
              title="Spin the Mystery Roulette"
            >
              <span>🎰 Mystery Wheel</span>
            </button>

            {/* Demo Cooking Mode button */}
            <button
              onClick={onOpenDemoCookingMode}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-typewriter font-bold rounded-md bg-[#FBF0DF] border border-[#334D66]/30 hover:border-[#E56960] text-[#334D66] hover:text-[#E56960] transition-all"
              title="Test the hands-free cooking assistant"
            >
              <span>⏱️ Cooking Mode</span>
            </button>

            <button
              onClick={() => onNavigate("saved")}
              className={`relative px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                currentView === "saved" || currentView === "saved-recipe"
                  ? "bg-[#334D66] text-[#FBF0DF] shadow-loro font-bold"
                  : "text-[#334D66] hover:bg-[#EDE3D3]/70 font-medium"
              }`}
            >
              <span>Cookbook</span>
              {savedCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold font-typewriter rounded-full bg-[#E56960] text-white">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate("ask")}
              className="inline-flex items-center gap-1.5 bg-[#E56960] hover:bg-[#C94F46] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 rounded-md shadow-loro-coral btn-shimmer transition-all hover:scale-102"
            >
              <span>+ New Feast</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
