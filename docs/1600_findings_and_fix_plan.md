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
| R6 | P0 | Generation has no server-side identity verification or usage limits. Frontend auth is Puter/local demo, whereas backend auth uses a separate JWT flow. | Add basic process-local request admission now. Next, integrate verified Puter identity and a restricted guest policy with shared atomic per-user quotas. Do not assume localStorage identity is trustworthy. Configure provider spend limits. | Verified Puter identity and shared quota code implemented; live deployment checks and provider spend cap pending |
| R7 | P0 | Dietary preferences are prompt text only; swaps do not account for restrictions. | Send structured restrictions, validate ingredients and compound products independently, block known conflicts and request confirmation for uncertain labels. Validate swaps too. This cannot guarantee freedom from allergens or cross-contact. | Implemented; local regression checked, live verification pending |
| R8 | P0 | Starter chicken instructions say “until done” without a thermometer endpoint. Generated/fallback instructions lack dependable safety enforcement. | Review starter recipes and apply reviewed food-specific temperature/handling rules to validated generated recipes. Add adversarial safety cases and cooking review. | Implemented; local regression checked, live verification pending |
| R9 | P1 | The prompt permits unconfirmed butter, lemon, and other staples despite the zero-grocery promise. | Collect confirmed staples and strict ingredient mode; compare structured recipe ingredients with inventory and disclose required missing items. Avoid claiming prompt wording alone enforces availability. | Implemented; local regression checked, live verification pending |
| R10 | P1 | Generation lacks explicit servings, equipment, time, and available quantities. | Add compact constraint inputs with defaults; send structured values and validate outputs against them. | Implemented; local regression checked, live verification pending |
| R11 | P1 | Swaps replace ingredient text without consistently adapting quantities or instructions. | Treat swaps as recipe adaptations; regenerate affected quantities and steps, then repeat dietary and safety validation. | Implemented; local regression checked, live verification pending |
| R12 | P1 | Cookbook uses one browser-wide key, shared by different signed-in accounts. | Scope local data to verified account identity, define guest migration explicitly, and verify cloud merge/sign-out/account-switch behavior. Preserve legacy data without silently assigning it to another account. | Implemented; local regression checked, live verification pending |
| R13 | P1 | Portion scaling replaces every number in ingredient text and matches integers before fractions. | Parse quantity/unit fields rather than arbitrary numbers; test fractions, ranges, package sizes, and quantities that should not scale. | Implemented; local regression checked, live verification pending |
| R14 | P1 | Backend auth has a known fallback JWT secret and public demo tokens. README describes stronger/different auth behavior than the current frontend. | Remove production fallback secrets; make demo access explicit and limited; reconcile auth documentation after identity integration. | Implemented; legacy password routes disabled by default |

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
- Identity and quota implementation follows below. Next: structured restrictions and inventory, independent dietary and safety validation.
- R7–R13 and the product hypotheses remain open; R14 remediation follows below. Existing swaps, saved data isolation, portion scaling, and starter safety instructions have not been repaired by this first batch.


## Second batch: identity and shared quotas

Implemented on 2026-10-06:

- Generation now requires a bounded Bearer credential, verified on every request by Puter's fixed HTTPS `/whoami` endpoint. Only the returned account ID determines quotas; browser profile IDs and legacy JWTs are not accepted as generation identities. Temporary Puter accounts are rejected. Tokens and emails are not stored by the verifier, and redirects are rejected.
- The browser reads its current token from the Puter SDK rather than copying credentials into the saved profile. Missing/expired credentials show a sign-in action while preserving the ingredient form.
- MongoDB `generation_quotas` stores atomic per-account minute/day and global daily reservations. Defaults are 5 per account per minute, 20 per account per UTC day, and 200 globally per UTC day. Deterministic bucket IDs use hashed account IDs, conditional increments and the unique `_id` index prevent over-reservation, and a TTL index cleans old buckets.
- Quota operations require majority write acknowledgement. Database/index/verification failures stop generation with an actionable error. The existing process-local admission limit remains an additional bound, not the shared quota mechanism.
- Each admitted attempt consumes quota even if the provider later fails. Reservations across minute/day/global buckets are deliberately conservative rather than transactional: a later rejection or storage failure can leave an earlier reservation consumed. No credits are refunded, avoiding concurrent retry/refund bypasses.
- Password routes require `ENABLE_LEGACY_AUTH=true` and a non-placeholder secret of at least 32 characters. Legacy JWTs pin HS256, issuer, and audience. Known seeded demo credentials and public demo token issuance were removed. Production password routes stop when MongoDB is unavailable; in-memory password accounts are development-only.
- Demo profiles continue to support browsing, starter recipes, and cooking previews, but cannot generate recipes. The sign-in modal explains this distinction.

Required deployment configuration:

1. Set `MONGODB_URI` or `MONGO_URI`. The database user must be able to read/write `generation_quotas` and create its TTL index. Missing configuration deliberately disables generation rather than bypassing quotas.
2. Optionally set `GENERATION_USER_MINUTE_LIMIT`, `GENERATION_USER_DAY_LIMIT`, and `GENERATION_GLOBAL_DAY_LIMIT` to positive integers. Keep limits consistent across instances and use a separate database for staging.
3. Keep legacy password auth disabled unless it is specifically needed. If enabling it, configure a random `JWT_SECRET` of at least 32 characters; the previously documented fallback is rejected.
4. Configure a monetary cap in the generation provider account separately. The global request cap bounds attempts, not currency, and does not prevent account-creation abuse or replace edge abuse protection.
5. Before deployment, verify a real Puter sign-in and run the optional live concurrency test against a dedicated MongoDB test database with `MONGO_QUOTA_TEST_URI`. Local regressions mock identity and storage and do not establish live provider compatibility or database permissions.

Sources for the integration:

- [Puter auth SDK source](https://github.com/HeyPuter/puter/blob/main/src/puter-js/src/modules/Auth.js): current SDK token and `/whoami` identity request.
- [Puter request implementation](https://github.com/HeyPuter/puter/blob/main/src/puter-js/src/lib/networkUtils.js): Bearer authorization behavior.
- [MongoDB write atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/): conditional single-document updates under concurrency.
- [MongoDB TTL indexes](https://www.mongodb.com/docs/manual/core/index-ttl/): expiration cleanup is separate from quota-window enforcement.

Verification:

- 45 mocked/unit regression cases passed across backend and frontend: 32 backend cases (identity verification, quota concurrency, handler ordering, legacy auth, and request-body checks) and 13 frontend cases (API errors, live-token selection/sign-out, and parsing).
- The optional live MongoDB concurrency test was skipped because `MONGO_QUOTA_TEST_URI` was not configured. Live Puter sign-in, deployed database permissions, and provider monetary caps were not exercised or changed.
- Production frontend build, backend syntax checks, and whitespace checks passed.
- No live deployment configuration has been changed. These code changes require the MongoDB configuration above before generation can run in deployment.
- R7–R13 remain pending. The next implementation batch is structured recipe data and explicit inventory/household constraints, followed by independent dietary and cooking-safety checks.

## Third batch: all seven recipe workflow features

Implemented on 2026-10-06. This section supersedes the pending R7–R13 status in the historical batches above.

| Feature / finding | Implemented fix | Main implementation |
| --- | --- | --- |
| Structured recipes / R4 | A shared strict JSON contract covers quantities, ranges, portions, equipment, timing and linked method steps. Both server and browser reject malformed responses; live generation no longer parses Markdown. The provider uses strict JSON schema for supported models and JSON object mode for other configured models. | `shared/recipes.js`, `backend/api/generate-recipe.js`, `frontend/src/lib/api.js` |
| Confirmed pantry / R9–R10 | The form captures available amounts, checked staples, portions, time, equipment, restrictions and exclusions. The server checks aggregate demand, compatible units, time and equipment. Strict pantry rejects known missing/insufficient food; unknown amounts require confirmation before cooking. Photos require entered ingredient confirmation. | `shared/pantry.js`, `IngredientForm.jsx` |
| Dietary and safety checks / R7–R8 | Independent rules reject known restriction conflicts in ingredient names and method text. Compound foods and religious certification require explicit label checks. Thermometer guidance accompanies relevant proteins; unsafe handling and detected insufficient internal endpoints are rejected. Starter chicken/egg methods were repaired and invented calorie claims removed. | `shared/recipe-safety.js`, `RecipeCard.jsx`, `savedRecipes.js` |
| Correct portions / R13 | Numeric ingredient quantities and ranges scale from the actual recipe yield. Ingredient references render scaled amounts in instructions. Package labels, cook times and temperatures remain fixed; pantry demand is checked again. Unstructured legacy recipes retain their exact text and disable scaling. | `shared/recipe-scaling.js` |
| Functional substitutions / R11 | A confirmed replacement and amount initiate one authenticated, quota-counted adaptation request. The full recipe must change its method or quantities, use the replacement, remove the old ingredient, and pass structural, inventory and dietary checks again. Failure retains the original recipe. | `shared/recipe-adaptation.js`, `SmartSwapModal.jsx` |
| Private cookbook / R12 | Browser keys are account-scoped; real accounts start without demo recipes. A preserved legacy browser collection requires an explicit ownership import. Sync verifies the SDK account, merges immutable save/delete records, and stops if the account changes. Offline and corrupt-data failures preserve local data and show a retry status. | `savedRecipes.js`, `cookbookSync.js`, `SavedPage.jsx` |
| Recommended dinner / product decision friction | One dinner appears first, ranked by missing food, label/quantity checks and total time. Alternatives are optional. Explicit cooking completion records meals; optional rating/shopping feedback and a 30-day account-local overview measure repeat cooking. | `shared/recipe-ranking.js`, `mealActivity.js`, `MultiRecipeStack.jsx` |

Additional integrity checks:

- Generation responses carry the server-verified account ID; the browser rejects a response if its account changed or the returned identity differs. Old-account generated views and selected cookbook cards are cleared on account change.
- Ingredient units and equipment use finite enums. Requests cannot smuggle extra prompt fields through constraints. Structured recipes have size bounds; output is capped at 8,192 completion tokens, superseding the first batch's 4,096-token bound. There is one provider call per attempt, including substitution attempts.
- Copy, full text downloads, native sharing and cooking mode use the same recipe view. The image postcard is explicitly a shortened preview, with a complete recipe download alongside it.
- Cloud records use separate immutable operation keys within the account's Puter KV namespace, avoiding whole-collection overwrites between devices. Legacy cloud arrays are read and merged, never overwritten. Delete records remain in the log so older saves do not resurrect recipes; undo creates a later save.

Practical limits and release verification:

- Ingredient screening is conservative and finite. It cannot infer full packaged-food composition, cross-contact, halal/kosher certification, food freshness or safe execution from food names. Users must verify relevant labels and use a thermometer; the UI does not claim allergy certification. Religious screening covers common conflicts, with certification/preparation confirmation required.
- Pantry matching uses explicit names and limited singular aliases. It does not infer density or package contents. Metric measurement conventions are 1 cup = 240 ml, 1 tbsp = 15 ml, 1 tsp = 5 ml; incompatible units require a manual check. Strict pantry mode still requires confirmation of unknown amounts.
- Text-only legacy recipes remain preserved but do not acquire validated structured data automatically. Use the reviewed conversion workflow below to enable scaling and substitutions. The legacy Markdown parser remains solely for compatibility tests/imports, outside the live generation path.
- Cloud conflicts resolve by operation timestamp then operation ID; original operations remain preserved. Device clock skew can affect the chosen revision. Sync runs after mutations, sign-in, reconnect and manual retry. Local browser storage still shares the same origin and is not a security boundary against scripts running on that origin.
- This batch initially stored meal metrics only on the device. The fourth batch below adds optional shared measurement and operator summaries; outcomes remain user-reported and are not proof of product-market fit.
- All seven code features are implemented; live Puter, Groq generation/vision and deployed Mongo permissions still require operator smoke testing. No paid provider calls or deployment changes were made during this batch.

Sources:

- [Groq structured outputs](https://console.groq.com/docs/structured-outputs): strict JSON schema and JSON object modes.
- [USDA safe minimum temperature chart](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart): protein temperature and rest guidance.
- [FDA food allergies](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies): ingredient labeling and cross-contact limits.
- [Puter KV set](https://docs.puter.com/KV/set/) and [KV list](https://docs.puter.com/KV/list/): per-account/app storage, distinct keys and prefix listing.

Verification for the third batch:

- 72 regression cases passed across 17 backend/frontend test files; one additional optional live MongoDB test was skipped because `MONGO_QUOTA_TEST_URI` was not configured. Both npm test commands also passed.
- Cases cover invalid structured output, input limits, quota/auth ordering, insufficient inventory, unit compatibility, allergens and ingredient references, unsafe handling, substitutions, ranges/package labels/temperatures, complete exports, account switching, cloud merge/delete/undo, legacy ownership import, and reported meal activity.
- A bundled React server-render test exercises the pantry form, recommended dinner, recipe card, cooking view and cookbook. This is a rendering smoke test, not an interactive browser or deployed-site test.
- Production frontend build and whitespace checks passed. The existing Browserslist age notice is informational; no unrelated dependency refresh was performed.
- Each feature and coherent follow-up fix has its own single-line Conventional Commit. This batch is committed locally; it has not been pushed or deployed.

## Fourth batch: pantry, editing, planning, cooking, measurement and nutrition

Implemented on 2026-10-06 following the request for all seven next areas. The errors and methods below describe the final code, superseding older roadmap claims.

| Area | Previous gap | Implemented method | Verification limit |
| --- | --- | --- | --- |
| Production verification | No repeatable release evidence; provider budget/device behavior unverified | Add JSON readiness reporting, read-only model checks, staging auth/generation checks and an explicit operator evidence matrix | Text model availability verified; paid generation, vision, provider cap, Mongo and real devices remain pending |
| Persistent pantry | Re-entry every meal; no stock/reminder dates or consumption tracking | Account store with quantities, entered reminder dates, explicit form save and reviewed idempotent session deduction | Local persistence and deduction regressions/browser checks |
| Recipe editing | No valid revision path; legacy quantities unstructured | Linked ingredient/method editor, repeat safety/pantry validation and reviewed conversion saved separately | Local validated revision and preservation checks; live conversion pending |
| Weekly plans | No schedule or consolidated demand | Scheduled snapshots, scaled ingredient aggregation, one pantry subtraction, visible unknowns and text download | Local arithmetic and browser persistence checks |
| Cooking UX | Refresh loses timers/checks; dialogs lack focus handling | Persist sessions and absolute timer deadlines; resume from kitchen; accessible controls and dialog focus/Escape/restore | Desktop Chromium and emulated Pixel 7; real iOS/Android pending |
| Product measurement | Local reports only; no consented aggregate/cost view | Default-off consent, bounded projected event queue, versioned server consent/deletion, account/operator summaries, anonymous usage with configured rate estimates | Unit/browser mocks; shared database and multi-device consent checks pending |
| Verified nutrition | No source data or reliable weight model | Server USDA Foundation/SR Legacy lookup, explicit edible gram weights, source snapshots, partial nutrient markers, scaling and revision invalidation | Arithmetic and endpoint mocks; direct public USDA lookup timed out, production key missing |

Documentation now describes current Puter identity, JSON contracts, actual fonts/colors and implemented versus future workflows. Raw request/recipe logging is off unless explicitly enabled. Each coherent feature/fix receives a single-line Conventional Commit; this batch is not deployed or pushed.

Nutrition source: [USDA API guide](https://fdc.nal.usda.gov/api-guide/) and [data dictionary](https://fdc.nal.usda.gov/portal-data/external/dataDictionary). Food matching and weights must reflect preparation; calculation does not yet model nutrient retention, cooking yield or nutritional requirements.

See [release verification](1700_release_verification.md) for remaining environment-dependent checks and provider monetary cap evidence.

Fourth-batch verification: 95 regression cases passed across 25 files; one optional live MongoDB case skipped. Eight desktop/mobile Playwright cases passed, including source-nutrition persistence and current-stock review; cooking overflow was rechecked after wrapping controls. Production frontend build and whitespace checks passed. Frontend/backend/root production dependency audits are clean after the Mongoose security update. Live service limits remain as recorded above.

## Fifth batch: landing motion and 3D illustration

Implemented GSAP hero/section motion with React cleanup and reduced-motion support. The landing page loads separately so these assets do not increase the initial kitchen bundle. A focused procedural Three.js plate assembles ingredients as the hero enters the viewport, with subtle pointer movement on fine-pointer devices. It renders on demand, pauses offscreen/backgrounded and disposes resources on unmount. A local static SVG handles loading, data saving, reduced motion, unavailable WebGL and context loss.

Verification: 38 frontend regression cases passed; eight landing and eight existing kitchen browser cases passed across desktop Chromium and emulated Pixel 7. Production build and production dependency audit passed. Desktop/mobile previews were visually inspected. Headless 3D checks use software WebGL; physical-device performance remains unverified. The renderer is an optional separate chunk (about 136 kB gzipped), and Vite reports its size warning. GSAP and Three.js changes have separate single-line Conventional Commits; no push or deployment was performed.

## Landing photography restoration

At the user's request, removed the animated Three.js noodle scene and restored the original hero photograph. Featured-dish and tools photographs remain in place, as do GSAP entrances, scroll reveals and reduced-motion support. Removed the renderer, SVG fallback, Three.js dependency and WebGL-specific browser checks. This supersedes the 3D illustration described in the fifth batch above.

Verification: production build passed without the previous renderer chunk warning. Four landing browser cases passed across desktop Chromium and emulated Pixel 7, covering the restored photograph, featured images, quick-start form, reduced motion and horizontal overflow.

## Recipe connection failure

The local preview was configured to call localhost:5000 directly while the backend was stopped, reproducing the reported network failure. Started the backend, changed local configuration to same-origin requests through Vite, and updated the environment example and setup instructions. Both direct API health and proxied health return 200; the proxied recipe route correctly rejects anonymous calls with 401.

Network failures now return an actionable connection message with NETWORK_UNAVAILABLE rather than the browser's raw Failed to fetch text. Requests are not automatically retried. Frontend regression tests and the production build passed. Desktop and mobile browser tests simulate a connection failure, verify all ingredients remain, and verify an explicit retry using a mocked successful response.

Actual generation remains unverified: this local backend has no MongoDB connection configured for mandatory shared quotas. Configure MONGODB_URI in backend/.env and sign in with Puter before checking a real generation.
