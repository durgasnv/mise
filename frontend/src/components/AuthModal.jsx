import { useState } from "react";
import { signInWithPuter, signInAsDemoChef, syncCookbookToPuterCloud, loadCookbookFromPuterCloud } from "../lib/auth";
import { getSavedRecipes, saveRecipe } from "../lib/savedRecipes";

export function AuthModal({ isOpen, onClose, onAuthSuccess, promptMessage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handlePuterSignIn() {
    setError("");
    setLoading(true);

    try {
      const user = await signInWithPuter();

      // Sync guest recipes to cloud or load existing cloud cookbook
      const localRecipes = getSavedRecipes();
      if (localRecipes && localRecipes.length > 0) {
        await syncCookbookToPuterCloud(localRecipes);
      } else {
        const cloudRecipes = await loadCookbookFromPuterCloud();
        if (cloudRecipes && Array.isArray(cloudRecipes)) {
          cloudRecipes.forEach((r) => saveRecipe(r));
        }
      }

      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      console.warn("Puter auth notice:", err.message);
      setError(err.message || "Sign in was cancelled or closed.");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoSignIn(name = "Chef Durga") {
    setError("");
    setLoading(true);

    try {
      const user = signInAsDemoChef(name);
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] rounded-loro-lg border border-[#EDE3D3] shadow-loro-lg max-w-md w-full p-6 sm:p-8 space-y-6 animate-toast-enter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EDE3D3] pb-4">
          <div>
            <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#E56960] flex items-center gap-1">
              <span>🍳</span> Mise Cloud Account
            </span>
            <h3 className="font-display text-2xl text-[#334D66]">
              Sign In to Your Kitchen
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#334D66] text-base p-1">
            ✕
          </button>
        </div>

        {/* Feature Lock Prompt Notice */}
        {promptMessage && (
          <div className="p-3.5 rounded-loro bg-[#FFF3EE] border border-[#E56960] text-xs font-semibold text-[#334D66] flex items-center gap-2.5">
            <span className="text-base">🔒</span>
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Error Notice if any */}
        {error && (
          <div className="p-3 rounded-loro bg-[#FFF3EE] border border-[#E56960] text-[#E56960] text-xs font-medium">
            {error}
          </div>
        )}

        {/* 1-Click Social / Puter & Google Login Actions */}
        <div className="space-y-3 pt-1">
          {/* Primary: Continue with Google / Puter */}
          <button
            type="button"
            onClick={handlePuterSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-loro font-bold text-xs uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all flex items-center justify-center gap-3 active:scale-98"
          >
            {loading ? (
              <span className="font-typewriter">AUTHENTICATING...</span>
            ) : (
              <>
                {/* Google & Puter Multi-Icon */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full text-slate-800 text-[11px]">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-bold text-[#334D66]">Google</span>
                </div>
                <span>Continue with Google / Puter →</span>
              </>
            )}
          </button>

          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#EDE3D3]"></div>
            </div>
            <span className="relative bg-[#FFFDF9] px-3 text-[11px] font-typewriter text-[#636951] uppercase">
              or instant demo
            </span>
          </div>

          {/* 1-Click Fast Guest Chef */}
          <button
            type="button"
            onClick={() => handleDemoSignIn("Chef Durga")}
            disabled={loading}
            className="w-full py-3 px-4 bg-[#334D66] hover:bg-[#1F3144] text-[#FBF0DF] rounded-loro text-xs font-typewriter font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🧑‍🍳 1-Click Demo Profile (Chef Durga)</span>
          </button>
        </div>

        {/* Cloud Benefit Points */}
        <div className="p-4 bg-[#FBF0DF]/70 rounded-loro border border-[#EDE3D3] space-y-2">
          <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#334D66] block">
            ☁️ Free Cloud Kitchen Perks:
          </span>
          <ul className="text-xs text-[#636951] space-y-1.5 font-medium">
            <li className="flex items-center gap-2">
              <span className="text-[#E56960]">✓</span>
              <span>Sync cookbook across mobile, iPad, and desktop</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#E56960]">✓</span>
              <span>Remember dietary restrictions & spice preference</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#E56960]">✓</span>
              <span>Instant hands-free cooking mode & smart timers</span>
            </li>
          </ul>
        </div>

        <p className="text-[11px] font-typewriter text-center text-[#636951]">
          Zero passwords required • Powered by Puter Cloud & Google OAuth
        </p>
      </div>
    </div>
  );
}
