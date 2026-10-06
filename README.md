# Mise

Mise helps home cooks choose a dinner from confirmed pantry ingredients, then plan, cook and review it. The UI uses a warm editorial style. Claims about savings, speed and repeat use require measured evidence.

The landing page uses GSAP entrances and scroll reveals, plus an optional Three.js plate illustration. Reduced-motion and data-saving preferences retain a local static SVG; rendering pauses offscreen. Landing assets load separately from the kitchen.

## Implemented workflows

- One recommended dinner with optional alternatives; bounded structured JSON, quantities, linked method steps, time, equipment and dietary checks.
- Account pantry inventory, user-entered reminder dates and reviewed, repeat-safe deductions after confirmed cooking.
- Structured recipe revisions and explicitly reviewed legacy conversions; originals remain preserved.
- Weekly dinner planning with scaled ingredient demand, pantry subtraction and downloadable shopping lists.
- Cooking steps, checklists and wall-clock timers persist on this device across refresh. Dialogs support keyboard focus, Escape and return focus.
- Account-scoped cookbook with immutable Puter cloud operations, offline merge, delete records and explicit legacy import.
- Optional consent-based activity sharing, 30-day account/operator summaries, withdrawal/deletion and anonymous operating token/cost counters. Sharing defaults off; unconfigured prices stay unpriced.
- USDA FoodData Central nutrition lookup with explicit food matches and edible gram weights. Missing ingredients/nutrients are marked partial; edits invalidate older calculations.
- Complete recipe text export and a clearly labeled image postcard preview.

Dietary screening uses finite rules and label confirmation; it cannot certify allergens, cross-contact or religious preparation. Pantry conversions do not infer food density or package contents. Entered dates are reminders, not freshness checks. Nutrition is an estimate from chosen food records, not a medical or dietary prescription.

## Local development

Use Node 20+ and npm. Install both packages:

```bash
npm --prefix backend install
npm --prefix frontend install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev:backend
# In a second terminal:
npm run dev:frontend
```

The frontend normally runs at `http://localhost:5173`; the backend uses port 5000. `VITE_API_URL` selects the API origin at build/dev time.

Backend configuration:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY`, `GROQ_TEXT_MODEL` | Server credential and text model; default `openai/gpt-oss-20b`. |
| `GROQ_VISION_MODEL` | Explicit image-capable model; photos are unavailable until configured. |
| `MONGODB_URI` or `MONGO_URI` | Shared atomic quotas, consent events and operating metrics. Missing quota storage stops generation. |
| `GENERATION_USER_MINUTE_LIMIT`, `GENERATION_USER_DAY_LIMIT`, `GENERATION_GLOBAL_DAY_LIMIT` | Attempt limits; defaults 5, 20 and 200. Failed attempts may consume quota. |
| `USDA_FDC_API_KEY` | Server-only key for Foundation/SR Legacy lookup. |
| `MISE_ADMIN_PUTER_IDS` | Comma-separated `puter:<uuid>` operator identities for aggregate measurements. |
| `GENERATION_MODEL_RATES_JSON` | Per-million-token rates: `{"model-id":{"input":0.1,"output":0.2}}`. Example values are illustrative, not provider prices. |
| `SAVE_RECIPE_HISTORY` | Optional raw request/output logging, disabled by default. |

The browser uses Puter sign-in and its current SDK credential. The server verifies Puter identity for generation, nutrition and measurement requests. Demo profiles permit local previews but do not authorize these services. Browser storage is account-scoped, not encrypted or isolated from scripts on the same origin. Pantry, plans and cooking progress currently remain on the device; cookbook recipes sync through Puter.

Legacy password endpoints are disabled by default. Enabling `ENABLE_LEGACY_AUTH=true` requires a random `JWT_SECRET` of at least 32 characters and production MongoDB; their JWTs do not authorize recipe services. Configure a monetary limit and alerts with the provider separately from application quotas.

## Verification and deployment

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run build
cd frontend
npx playwright install chromium
npm run test:e2e
cd ../backend
npm run check:models
npm run check:release
```

Serverless routes exist in `api/` and `frontend/api/`; `backend/server.js` serves the same handlers locally. Set backend secrets on the deployment and build the frontend with the correct API origin. Do not publish `.env` files.

[Release checks and remaining live verification](docs/1700_release_verification.md) distinguish local mock/browser coverage from real provider, database, account and device checks. [Findings and fixes](docs/1600_findings_and_fix_plan.md) records the completed implementation; [API contracts](docs/1400_api_reference_and_schemas.md) describes requests and data.
