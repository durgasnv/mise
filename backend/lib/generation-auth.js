import { GenerationError } from "./generation-guards.js";

const PUTER_IDENTITY_URL = "https://api.puter.com/whoami";

export function readBearerToken(req) {
  const header = req.headers?.authorization;
  if (typeof header !== "string" || header.length > 8192 || !/^Bearer [^\s]+$/i.test(header)) {
    throw new GenerationError(401, "AUTH_REQUIRED", "Sign in with Puter to generate recipes. Demo mode is for browsing and cooking previews.");
  }
  return header.slice(7);
}

export async function authenticateGeneration(req, { fetchImpl = fetch } = {}) {
  const token = readBearerToken(req);
  try {
    // Fixed HTTPS identity endpoint: never forward credentials to a client-supplied URL.
    const response = await fetchImpl(PUTER_IDENTITY_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (response.status === 401 || response.status === 403) {
      throw new GenerationError(401, "AUTH_REQUIRED", "Your sign-in could not be verified. Sign in with Puter again to generate recipes.");
    }
    if (!response.ok) throw new Error("Identity provider unavailable");
    const user = await response.json();
    if (!user || typeof user.uuid !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(user.uuid)) {
      throw new Error("Invalid identity response");
    }
    if (user.is_temp) {
      throw new GenerationError(403, "ACCOUNT_REQUIRED", "Use a permanent Puter account to generate recipes. Temporary accounts can browse the demo.");
    }
    // Do not retain tokens, emails, or unverified IDs from the request body.
    return { id: `puter:${user.uuid}`, provider: "puter" };
  } catch (error) {
    if (error instanceof GenerationError) throw error;
    throw new GenerationError(503, "AUTH_UNAVAILABLE", "We could not verify your sign-in right now. Please try again later.");
  }
}
