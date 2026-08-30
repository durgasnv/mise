const TOKEN_KEY = "mise_auth_token_v1";
const USER_KEY = "mise_auth_user_v1";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Returns saved JWT token.
 */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Returns currently authenticated user object from localStorage.
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);

  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);

  window.dispatchEvent(new CustomEvent("mise-auth-change", { detail: { user } }));
}

/**
 * Register a new chef account.
 */
export async function registerChef({ name, email, password, avatar }) {
  const url = `${API_BASE_URL}/api/auth/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, avatar }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Registration failed.");
  }

  setSession(data.token, data.user);
  return data.user;
}

/**
 * Login with existing credentials.
 */
export async function loginChef({ email, password }) {
  const url = `${API_BASE_URL}/api/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Login failed.");
  }

  setSession(data.token, data.user);
  return data.user;
}

/**
 * 1-Click instant demo login (Chef Durga).
 */
export async function demoLogin() {
  const url = `${API_BASE_URL}/api/auth/demo-login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Local fallback if server route is offline
    const fallbackUser = {
      _id: "demo-user-1",
      name: "Chef Durga",
      email: "chef@mise.kitchen",
      avatar: "👨‍🍳",
      dietaryPreferences: ["High Protein", "Gluten-Friendly"],
      spicePreference: "Bold & Smoky",
      kitchenStaples: ["Cultured Butter", "Garlic Confit", "Smoked Flake Salt", "Chili Crisp"],
      savedRecipes: [],
    };
    setSession("demo-token-123", fallbackUser);
    return fallbackUser;
  }

  setSession(data.token, data.user);
  return data.user;
}

/**
 * Logout current chef.
 */
export function logoutChef() {
  setSession(null, null);
}

/**
 * Updates dietary preferences, spice level, or kitchen staples.
 */
export async function updateTastePreferences(preferences) {
  const token = getAuthToken();
  const currentUser = getCurrentUser();

  if (!token) {
    // If not logged in, update local guest preferences
    const updated = { ...(currentUser || {}), ...preferences };
    setSession(null, updated);
    return updated;
  }

  try {
    const url = `${API_BASE_URL}/api/auth/preferences`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || "Failed to update taste profile.");
    }

    setSession(token, data.user);
    return data.user;
  } catch {
    const updated = { ...currentUser, ...preferences };
    setSession(token, updated);
    return updated;
  }
}

/**
 * Sync guest recipes to cloud profile.
 */
export async function syncGuestRecipes(recipes) {
  const token = getAuthToken();
  if (!token || !Array.isArray(recipes) || recipes.length === 0) return;

  try {
    const url = `${API_BASE_URL}/api/auth/sync-recipes`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipes }),
    });
  } catch (err) {
    console.warn("Recipe sync notice:", err.message);
  }
}
