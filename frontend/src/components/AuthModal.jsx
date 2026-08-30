import { useState } from "react";
import { loginChef, registerChef, demoLogin, syncGuestRecipes } from "../lib/auth";
import { getSavedRecipes } from "../lib/savedRecipes";

const AVATAR_OPTIONS = ["🧑‍🍳", "👨‍🍳", "👩‍🍳", "🔥", "🥩", "🌶️", "🥑", "🔪"];

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("🧑‍🍳");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginChef({ email, password });
      const guestRecipes = getSavedRecipes();
      if (guestRecipes.length > 0) {
        await syncGuestRecipes(guestRecipes);
      }
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await registerChef({ name, email, password, avatar });
      const guestRecipes = getSavedRecipes();
      if (guestRecipes.length > 0) {
        await syncGuestRecipes(guestRecipes);
      }
      if (onAuthSuccess) onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError("");
    setLoading(true);
    try {
      const user = await demoLogin();
      const guestRecipes = getSavedRecipes();
      if (guestRecipes.length > 0) {
        await syncGuestRecipes(guestRecipes);
      }
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
            <span className="text-[11px] font-typewriter font-bold uppercase tracking-wider text-[#E56960]">
              Mise Culinary Account
            </span>
            <h3 className="font-display text-2xl text-[#334D66]">
              {tab === "login" ? "Welcome Back, Chef" : "Create Chef Account"}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#334D66] text-base p-1">
            ✕
          </button>
        </div>

        {/* 1-Click Demo Login Highlight Box */}
        <div className="p-3.5 bg-[#FBF0DF] border border-[#EDE3D3] rounded-loro space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-typewriter font-bold text-[#334D66] uppercase flex items-center gap-1.5">
              <span>⚡</span> Fast Demo Mode
            </span>
            <span className="text-[10px] bg-[#E56960] text-white px-2 py-0.5 rounded-full font-typewriter font-bold">
              Instant
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-[#334D66] hover:bg-[#1F3144] text-[#FBF0DF] rounded-md text-xs font-typewriter font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🧑‍🍳 1-Click Demo Login (Chef Durga)</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#EDE3D3]">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2 text-xs font-typewriter font-bold uppercase tracking-wider border-b-2 transition-all ${
              tab === "login"
                ? "border-[#E56960] text-[#E56960]"
                : "border-transparent text-[#636951] hover:text-[#334D66]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-2 text-xs font-typewriter font-bold uppercase tracking-wider border-b-2 transition-all ${
              tab === "register"
                ? "border-[#E56960] text-[#E56960]"
                : "border-transparent text-[#636951] hover:text-[#334D66]"
            }`}
          >
            New Chef Account
          </button>
        </div>

        {/* Error notice if any */}
        {error && (
          <div className="p-3 rounded bg-[#FFF3EE] border border-[#E56960] text-[#E56960] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4">
          {tab === "register" && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-typewriter font-bold text-[#334D66] uppercase">
                  Chef Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Durga S."
                  className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-typewriter font-bold text-[#334D66] uppercase">
                  Choose Chef Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-9 h-9 rounded-full text-lg flex items-center justify-center border transition-all ${
                        avatar === av
                          ? "bg-[#334D66] border-[#334D66] scale-110 shadow-sm"
                          : "bg-white border-[#EDE3D3] hover:bg-[#FBF0DF]"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-typewriter font-bold text-[#334D66] uppercase">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chef@example.com"
              className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-typewriter font-bold text-[#334D66] uppercase">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FBF0DF]/60 border border-[#EDE3D3] focus:border-[#E56960] focus:bg-white text-sm text-[#334D66] font-medium rounded-lg px-3.5 py-2.5 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-loro font-bold text-xs uppercase tracking-wider text-white bg-[#E56960] hover:bg-[#C94F46] shadow-loro-coral btn-shimmer transition-all mt-2"
          >
            {loading ? "AUTHENTICATING..." : tab === "login" ? "Sign In To Mise →" : "Create Account & Sync Cookbook →"}
          </button>
        </form>

        <p className="text-[11px] font-typewriter text-center text-[#636951]">
          Cloud profiles automatically sync your saved recipes and dietary restrictions.
        </p>
      </div>
    </div>
  );
}
