const rejectedSecrets = new Set(["mise_secret_chef_jwt_key_2026", "replace_with_a_long_random_secret", "your_long_random_secret"]);

export function legacyAuthSecret(env = process.env) {
  const secret = typeof env.JWT_SECRET === "string" ? env.JWT_SECRET.trim() : null;
  return typeof secret === "string" && secret.length >= 32 && !rejectedSecrets.has(secret) ? secret : null;
}

export function legacyAuthEnabled(env = process.env) {
  return env.ENABLE_LEGACY_AUTH === "true";
}
