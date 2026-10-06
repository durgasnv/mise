# 1400 • API Reference & Data Schemas

## 1. REST API Endpoints

### 1.1 `POST /api/generate-recipe`
Returns one to three validated structured dinners. The browser ranks them by pantry fit and shows one recommendation first.

Headers: `Content-Type: application/json`, `Authorization: Bearer <current Puter SDK token>`. The server verifies identity; demo profiles and legacy JWTs cannot authorize generation. MongoDB quotas apply before the provider call.

Request:

```json
{
  "question": "Recommend a dinner with potatoes.",
  "constraints": {
    "pantry": [{ "name": "potato", "quantity": 500, "unit": "g" }],
    "staples": [],
    "servings": 2,
    "maxMinutes": 30,
    "equipment": ["stovetop", "skillet"],
    "strictPantry": true,
    "restrictions": ["vegan"],
    "excludedIngredients": []
  }
}
```

`image` is optional embedded JPEG, PNG or WebP data (up to 2 MB). The browser requires typed confirmation of photo ingredients. Question text is bounded at 6,000 characters. Pantry quantities may be `null` when unknown; strict mode rejects known missing/insufficient food and exposes unknown quantity checks.

Successful response:

```json
{
  "accountId": "puter:verified-account-id",
  "recipes": [{
    "title": "Skillet potatoes",
    "servings": 2,
    "prepMinutes": 5,
    "cookMinutes": 15,
    "equipment": ["stovetop", "skillet"],
    "ingredients": [{
      "id": "potato", "name": "potato", "quantity": 400,
      "quantityMax": null, "unit": "g", "preparation": "diced", "packageSize": ""
    }],
    "steps": [{
      "text": "Cook {ingredient:potato} in the skillet for 15 minutes, until tender.",
      "ingredientIds": ["potato"]
    }],
    "chefNote": "Cut evenly."
  }],
  "reviews": [{ "missing": [], "quantityChecks": [], "labelChecks": [], "safetyNotes": [] }],
  "constraints": { "pantry": [{ "name": "potato", "quantity": 500, "unit": "g" }], "staples": [], "servings": 2, "maxMinutes": 30, "equipment": ["stovetop", "skillet"], "strictPantry": true, "restrictions": ["vegan"], "excludedIngredients": [] }
}
```

Method amounts use `{ingredient:ID}` references. The UI scales those references together with numeric ingredient quantities. Ranges use `quantityMax`; fixed package labels use `packageSize`. Nutrition is not estimated. The live endpoint returns no Markdown `response` field. The shared schema and validators are in `shared/recipes.js`, `shared/pantry.js` and `shared/recipe-safety.js`.

Units: `g`, `kg`, `ml`, `l`, `tsp`, `tbsp`, `cup`, `count`, `pack`. Equipment: `stovetop`, `skillet`, `pot`, `oven`, `microwave`, `air fryer`, `blender`, `grill`. Supported dietary codes are exported as `RESTRICTIONS` in `shared/recipe-safety.js`. Uncertain labels require confirmation; a successful response is not allergen certification.

Adaptation uses the same endpoint and gates. Add `"action": "adapt"`, `"recipe": <one structured recipe>`, `"ingredientId": "potato"`, and `"replacement": { "name": "carrot", "quantity": 500, "unit": "g" }` to a request containing question and constraints. It returns exactly one complete revised recipe; the server derives the replacement pantry and validates the revision.

Errors use `{ "code": "...", "error": "actionable message" }`: 400 invalid input/constraints/adaptation, 401 missing/invalid authentication, 403 temporary account, 413 oversized input, 429 admission/account/global quotas with `Retry-After`, 502 invalid or failed provider output, 503 missing provider/vision/quota configuration, 504 provider timeout. Failed attempts may consume reserved quota. Responses are not cached.

### `POST /api/generate-recipe`: legacy conversion

Use `action: "convert"`, question, constraints and `legacy: { title, ingredients: string[], instructions: string[] }`. Exactly one proposed structured recipe is returned through the same authentication/quota gates. The UI requires review and saves a separate copy with its legacy source ID; it does not overwrite the original.

### `POST /api/nutrition`

Requires the current Puter Bearer token and `accountId: "puter:<uuid>"`. The server compares that field with verified identity before quota or lookup. Search: `{ action: "search", query, accountId }` returns up to eight Foundation/SR Legacy food descriptions and FDC IDs. Calculate: `{ action: "calculate", recipe: <structured recipe>, matches: [{ ingredientId, fdcId, grams }], accountId }`.

The server fetches official nutrient records itself; client nutrient values are ignored. At most 40 selected matches are fetched in one 10-second bounded batch. Results contain source snapshots, totals, per-serving values, missing ingredients and a recipe fingerprint. Each nutrient amount has `complete: true|false`; partial known totals do not mean missing foods have zero nutrients. Rates are 20 account lookups/minute and 100 globally/minute. Missing USDA configuration or quota storage returns 503, not invented nutrition.

### `POST /api/measurements`

Requires the same identity binding. Actions:

- `{ action: "consent", enabled: boolean, accountId }` changes consent and returns a consent version. Disabling deletes that account's shared events.
- `{ action: "events", consentVersion, events: [...], accountId }` accepts up to 20 projected events only under the current enabled consent version. Event IDs deduplicate retries and feedback updates. Allowed types: generated, generationFailed, saved, cookingStarted, mealCompleted. Optional metadata: durationMs, bounded errorCode, rating 1–5 and neededShopping boolean/null. Private text fields are dropped.
- `{ action: "summary", accountId }` returns the account's consented 30-day summary.
- `{ action: "admin", accountId }` requires `MISE_ADMIN_PUTER_IDS`; returns aggregate consented activity and anonymous operating token/cost counters. Missing usage or rates remains an unpriced count.

Events expire after 90 days. Withdrawal changes the version before deletion and insertion rechecks that version; an older upload cannot restore revoked activity. Browser collection is off by default and does not backfill the local journal. Operational request counts contain no account/recipe identifiers. Raw query history is separately disabled unless `SAVE_RECIPE_HISTORY=true`.

### Health and legacy endpoints

`GET /api/health` returns a liveness response, not proof that authenticated generation, MongoDB or USDA is usable.

Legacy `/api/auth/register`, `/login`, `/me`, `/preferences` and `/sync-recipes` are disabled unless `ENABLE_LEGACY_AUTH=true` and a valid secret are configured. The active frontend uses Puter instead. Legacy JWTs do not grant generation, nutrition or measurement access. Public demo token issuance is disabled.

### Browser and cloud schemas

The cookbook is `{ version: 3, operations: [{ type: "save"|"delete", id, opId, at, recipe? }] }`, scoped to the account. Puter stores immutable operations in individual keys. Saves retain structured source, constraints and optional validated nutrition; deletes retain tombstones. Legacy recipes keep text and scaling remains disabled until conversion.

Pantry, weekly plans, cooking sessions and meal journals use account-scoped browser stores, separate from cloud cookbook. Cooking timers persist `{ remainingSeconds, deadline }`; a deadline is an absolute timestamp. Planned dinners retain recipe snapshots. Pantry deductions use a unique cooking-session ID and reviewed amounts.

[Release verification](1700_release_verification.md) records configured versus actually verified services.
