const USER_STORAGE_KEY = "mise_active_chef_user_v3";

/**
 * Returns currently authenticated user object from localStorage.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getGenerationAuthorization() {
  const user = getCurrentUser();
  const token = typeof window !== "undefined" ? window.puter?.authToken : null;
  if (user?.provider !== "puter" || typeof token !== "string" || !token) {
    const error = new Error("Sign in with Puter to generate recipes. Demo mode is for browsing and cooking previews.");
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  // Read the current SDK token for each request; do not duplicate it in our profile storage.
  return { Authorization: `Bearer ${token}` };
}

/**
 * Checks if a user is currently signed in.
 */
export function isUserSignedIn() {
  if (typeof window !== "undefined" && window.puter?.auth?.isSignedIn?.()) {
    return true;
  }
  return Boolean(getCurrentUser());
}

function setLocalSession(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent("mise-auth-change", { detail: { user } }));
}

/**
 * Sign In using Puter.js (Supports Google, GitHub, Puter & Email).
 */
export async function signInWithPuter() {
  if (typeof window === "undefined" || !window.puter) {
    throw new Error("Puter authentication SDK is loading. Please try again in a moment.");
  }

  try {
    // Triggers Puter / Google Auth Popup
    await window.puter.auth.signIn();
    const puterUser = await window.puter.auth.getUser();

    if (!puterUser || typeof puterUser.uuid !== "string" || !puterUser.uuid) {
      throw new Error("Could not retrieve user profile.");
    }

    const chefUser = {
      id: puterUser.uuid,
      name: puterUser.username || "Chef",
      email: puterUser.email || `${puterUser.username}@puter.com`,
      avatar: "🧑‍🍳",
      provider: "puter",
      dietaryPreferences: [],
      spicePreference: "Medium Balanced",
      kitchenStaples: ["Olive Oil", "Flake Sea Salt", "Garlic", "Butter"],
    };

    // Try to load user's taste preferences and cloud cookbook from Puter KV
    try {
      const savedPrefs = await window.puter.kv.get("mise_taste_prefs");
      if (savedPrefs) {
        const parsed = typeof savedPrefs === "string" ? JSON.parse(savedPrefs) : savedPrefs;
        chefUser.dietaryPreferences = parsed.dietaryPreferences || chefUser.dietaryPreferences;
        chefUser.spicePreference = parsed.spicePreference || chefUser.spicePreference;
        chefUser.kitchenStaples = parsed.kitchenStaples || chefUser.kitchenStaples;
      }
    } catch {
      // Ignored if empty
    }

    setLocalSession(chefUser);
    return chefUser;
  } catch (err) {
    console.error("Puter Auth error:", err);
    throw new Error(err?.message || "Sign in cancelled or failed.");
  }
}

/**
 * 1-Click Instant Demo / Guest Chef Login (No popups, zero hassle).
 */
export function signInAsDemoChef(name = "Chef Durga") {
  const demoUser = {
    id: `demo-${Date.now()}`,
    name: name,
    email: "chef@mise.kitchen",
    avatar: "👨‍🍳",
    provider: "demo",
    dietaryPreferences: ["High Protein", "Gluten-Friendly"],
    spicePreference: "Bold & Smoky",
    kitchenStaples: ["Cultured Butter", "Garlic Confit", "Smoked Flake Salt", "Chili Crisp"],
  };

  setLocalSession(demoUser);
  return demoUser;
}

/**
 * Sign Out from Puter and clear session.
 */
export async function signOutChef() {
  try {
    if (typeof window !== "undefined" && window.puter?.auth?.signOut) {
      await window.puter.auth.signOut().catch(() => {});
    }
  } catch {
    // Ignore signOut errors
  }

  setLocalSession(null);
}

/**
 * Saves or updates taste & dietary preferences in Puter KV & local storage.
 */
export async function updateTastePreferences(preferences) {
  const currentUser = getCurrentUser() || {};
  const updatedUser = { ...currentUser, ...preferences };

  setLocalSession(updatedUser);

  // Sync to Puter Cloud KV if connected
  if (updatedUser.provider === "puter" && typeof window !== "undefined" && window.puter?.kv?.set && window.puter?.authToken) {
    try {
      const token = window.puter.authToken;
      const identity = await window.puter.auth.getUser();
      if (identity?.uuid !== updatedUser.id || window.puter.authToken !== token || getCurrentUser()?.id !== updatedUser.id) throw new Error('Account changed before preference sync.');
      await window.puter.kv.set("mise_taste_prefs", JSON.stringify({
        dietaryPreferences: updatedUser.dietaryPreferences,
        spicePreference: updatedUser.spicePreference,
        kitchenStaples: updatedUser.kitchenStaples,
      }));
    } catch (err) {
      console.warn("Puter KV sync notice:", err.message);
    }
  }

  return updatedUser;
}
