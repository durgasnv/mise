import "dotenv/config";

// Run from backend/ so dotenv loads the backend's local configuration.
if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY is missing.");
  process.exitCode = 1;
} else {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Model lookup returned HTTP ${response.status}.`);
    const payload = await response.json();
    const available = new Set((payload.data || []).map((model) => model.id));
    for (const [kind, model] of [
      ["Text", process.env.GROQ_TEXT_MODEL?.trim() || "openai/gpt-oss-20b"],
      ["Vision", process.env.GROQ_VISION_MODEL?.trim()],
    ]) {
      if (!model) {
        console.log(`${kind}: disabled (no model configured).`);
      } else if (available.has(model)) {
        console.log(`${kind}: ${model} is available. Verify its capabilities in provider documentation.`);
      } else {
        console.error(`${kind}: ${model} is unavailable for this account.`);
        process.exitCode = 1;
      }
    }
  } catch {
    console.error("Could not check model availability. Check credentials, provider status, and connectivity.");
    process.exitCode = 1;
  }
}
