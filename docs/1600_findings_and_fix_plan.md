# Mise findings and implementation plan

Reviewed: 2026-10-05. This document separates observed defects from product hypotheses. Repository findings have not been verified against the live deployment.

## Confirmed defects and proposed fixes

| ID | Priority | Finding and evidence | Fix and implementation method | Status |
| --- | --- | --- | --- | --- |
| R1 | P0 | `backend/api/generate-recipe.js` hardcodes deprecated text and vision models. | Use an environment-configurable supported text model. Require an explicitly configured vision model rather than guessing one. Add an operator model-availability check. | Implemented; regression checked |
| R2 | P0 | Failed vision requests retry without the image, so a generic photo prompt can yield an unrelated dinner. | Remove silent text retry; return an actionable photo error and allow users to enter ingredients themselves. | Implemented; regression checked |
| R3 | P0 | `HomePage.jsx` replaces all API failures with generic recipes, concealing outages, limits, and photo errors. | Show an accessible error, preserve inputs, clear stale results, and allow a normal retry. | Implemented; regression checked |
| R4 | P0 | `parseRecipes.js` fabricates missing ingredients, instructions, calories, and extra recipes. | Reject incomplete responses; display only recipes actually returned, and label missing optional metadata as unavailable. | Implemented; regression checked |
| R5 | P0 | The generation handler accepts unchecked value types and large payloads; local `server.js` buffers bodies without a limit. | Validate question/image types and sizes before provider calls, reject unsupported image formats, bound HTTP request bodies and provider output. | Implemented; regression checked |
| R6 | P0 | Generation has no server-side identity verification or usage limits. Frontend auth is Puter/local demo, whereas backend auth uses a separate JWT flow. | Add basic process-local request admission now. Next, integrate verified Puter identity and a restricted guest policy with shared atomic per-user quotas. Do not assume localStorage identity is trustworthy. Configure provider spend limits. | Local admission implemented; production protection pending |
| R7 | P0 | Dietary preferences are prompt text only; swaps do not account for restrictions. | Send structured restrictions, validate ingredients and compound products independently, block known conflicts and request confirmation for uncertain labels. Validate swaps too. This cannot guarantee freedom from allergens or cross-contact. | Pending |
| R8 | P0 | Starter chicken instructions say “until done” without a thermometer endpoint. Generated/fallback instructions lack dependable safety enforcement. | Review starter recipes and apply reviewed food-specific temperature/handling rules to validated generated recipes. Add adversarial safety cases and cooking review. | Pending |
| R9 | P1 | The prompt permits unconfirmed butter, lemon, and other staples despite the zero-grocery promise. | Collect confirmed staples and strict ingredient mode; compare structured recipe ingredients with inventory and disclose required missing items. Avoid claiming prompt wording alone enforces availability. | Pending |
| R10 | P1 | Generation lacks explicit servings, equipment, time, and available quantities. | Add compact constraint inputs with defaults; send structured values and validate outputs against them. | Pending |
| R11 | P1 | Swaps replace ingredient text without consistently adapting quantities or instructions. | Treat swaps as recipe adaptations; regenerate affected quantities and steps, then repeat dietary and safety validation. | Pending |
| R12 | P1 | Cookbook uses one browser-wide key, shared by different signed-in accounts. | Scope local data to verified account identity, define guest migration explicitly, and verify cloud merge/sign-out/account-switch behavior. Preserve legacy data without silently assigning it to another account. | Pending |
| R13 | P1 | Portion scaling replaces every number in ingredient text and matches integers before fractions. | Parse quantity/unit fields rather than arbitrary numbers; test fractions, ranges, package sizes, and quantities that should not scale. | Pending |
| R14 | P1 | Backend auth has a known fallback JWT secret and public demo tokens. README describes stronger/different auth behavior than the current frontend. | Remove production fallback secrets; make demo access explicit and limited; reconcile auth documentation after identity integration. | Pending |

## Product hypotheses and validation work

These are risks to test, not established defects or decisions to silently impose.

| Risk | Proposed response | Evidence to collect |
| --- | --- | --- |
| Existing competitors cover ingredient matching and pantry photos. | Start with one audience and a dependable weeknight-dinner use case. | Compare task completion and repeat cooking against users' existing methods. |
| Entering inventory and comparing three dishes adds work. | Test one recommended dinner with optional alternatives. | Time to meal choice, corrections, meals actually cooked. |
| Gourmet positioning conflicts with budget and beginner needs. | Prioritize usable ingredients, equipment, timing, and cleanup; make extras optional. | Observed cooking sessions and household feedback. |
| Subscription demand and ingredient-count paywalls are unproven. | Test payment after successful repeat use; evaluate planning/household benefits. | Actual purchases and retention, not survey intent alone. |
| Pantry maintenance could outweigh saved effort. | Start with per-meal entry; test inventory updates before expanding tracking. | Inventory accuracy and maintenance effort. |
| Zero waste, under-three-second, and restaurant-quality claims lack measured support. | Audit public claims; use qualified wording supported by measurements. | Latency, actual extra purchases, discarded ingredients, cooking outcomes. |
| Acquisition and retention are unproven. | Test one channel with 20 users from one audience over four weeks. | Acquisition cost per returning cook, repeat dinners, reasons for stopping. |
| Delivery, IoT, nutrition, and social features expand maintenance before proving demand. | Defer expansion until the core cooking loop is reliable and repeatedly used. | Core reliability, repeat use, willingness to pay. |

## Implementation sequence

1. Write this findings file before editing application code.
2. Complete the first reliability batch: R1–R5 plus a bounded local admission baseline for R6. Keep the existing Markdown API contract for now; never invent recipes to satisfy a count.
3. Verify with mocked provider/handler tests, parser regression cases, and a production frontend build. No paid live generation is required for these checks.
4. Integrate verified identity, shared quotas, and provider spending controls before treating the public endpoint as production-protected.
5. Introduce a structured recipe schema, explicit ingredient/household constraints, and independent dietary/safety checks. Validate the whole path before advertising guarantees.
6. Repair cookbook isolation, substitutions, and scaling with account-switch and cooking regression coverage.
7. Test the simplified dinner experience and business assumptions with real cooking sessions.

Create a separate single-line Conventional Commit for each coherent change. This plan does not authorize treating unimplemented items as complete.

## Acceptance criteria for the first batch

- Provider/model configuration failures are visible, with no fabricated successful response.
- Photo failures never trigger a text-only generation behind the user's back.
- Invalid or oversized inputs make no provider requests.
- Provider responses and generation requests have explicit resource bounds.
- Local admission returns 429 with Retry-After when exhausted; limitations across serverless instances are documented.
- A partial recipe response produces only real complete recipes; missing instructions/ingredients produce an error.
- Frontend shows actionable errors and allows a retry without losing input.
- Tests pass and frontend builds. Live provider availability is checked separately by an operator.

## Sources

- [Groq model deprecations](https://console.groq.com/docs/deprecations): the old vision model was shut down in April 2025; the old text model is enterprise-only after August 2026.
- [Groq supported models](https://console.groq.com/docs/models): checked on the review date; supported models can change. Vision requires explicit operator selection.
- [USDA doneness and safety](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/doneness-versus-safety): thermometer-based poultry guidance.
- [SuperCook](https://www.supercook.com/) and [Samsung Food ingredient search](https://support.samsungfood.com/hc/en-us/articles/30251599415956-How-to-Search-for-Recipes-Using-Your-Available-Ingredients): competitive overlap.

## Implementation results

First batch completed on 2026-10-06:

- R1: text model defaults to `openai/gpt-oss-20b`; both model IDs can be configured. Added `backend/.env.example` and `npm run check:models`. The availability script checks account-visible IDs, not image capability. Live account availability was not checked in this implementation run.
- R2: provider photo failures return an actionable error; no text-only retry occurs.
- R3: frontend displays an accessible generation error, preserves the form, and clears stale recipe results. There is no generic recipe fallback.
- R4: parser requires a title, ingredient list, and instructions. It returns only actual supplied recipes and marks missing optional metadata as “Not provided.” Metadata parsing also now handles bold labels correctly. This is structural validation, not proof of dietary compliance, safety, or taste.
- R5: up to 6,000 question characters, 2 MB of embedded JPEG/PNG/WebP data with format-signature checks, 3 MB of raw HTTP body data, 4,096 completion tokens, a 25-second provider deadline, and a 40-second browser deadline. Oversized/interrupted local HTTP uploads are rejected; UTF-8 remains intact across network chunks. Serverless platform body limits still apply before the handler.
- R6 baseline: 20 admitted requests per minute per running process, with 429 and Retry-After. This limit resets with process lifecycle, is shared by all clients of that process, and is multiplied across serverless instances. It does not establish user identity, fairness, durable quotas, or a global budget.

Verification:

- 12 mocked backend generation/handler regression cases passed.
- 3 HTTP request-body regression cases passed.
- 5 recipe-parser regression cases passed.
- 4 frontend API-client regression cases passed.
- `npm --prefix backend test` and `npm --prefix frontend test` are available as repeatable checks.
- Production frontend build passed; backend server and model-check script passed syntax checks.
- Whitespace checks passed with CRLF recognized for the existing package manifests.
- Provider calls were mocked. No paid live generation or deployed-site browser test was performed.

Configuration and remaining work:

- Set `GROQ_API_KEY` on the backend/deployment, optionally override `GROQ_TEXT_MODEL`, and explicitly select a supported image-capable `GROQ_VISION_MODEL` to enable photo scanning. A missing vision setting produces an honest unavailable message; text entry remains usable.
- Run `npm run check:models` from `backend/` before deployment and after changing provider configuration. Verify vision capability separately.
- Next: verified frontend-provider identity and shared atomic quotas, removal of legacy insecure JWT/demo defaults, structured restrictions and inventory, independent dietary and safety validation.
- R7–R14 and the product hypotheses remain open. Existing swaps, saved data isolation, portion scaling, and starter safety instructions have not been repaired by this first batch.
