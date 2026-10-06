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

Legacy password endpoints below are disabled unless explicitly configured with `ENABLE_LEGACY_AUTH=true` and a valid secret. Their tokens do not grant generation access.

---

### 1.2 `POST /api/auth/register`
Creates a new chef account.

* **Request Body**:
```json
{
  "name": "Durga S.",
  "email": "durga@example.com",
  "password": "securepassword123",
  "avatar": "🧑‍🍳"
}
```
* **Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "66d1a2b3c4d5e6f7a8b9c0d1",
    "name": "Durga S.",
    "email": "durga@example.com",
    "avatar": "🧑‍🍳",
    "dietaryPreferences": [],
    "spicePreference": "Medium Heat",
    "kitchenStaples": ["Olive Oil", "Flake Sea Salt", "Garlic", "Butter"],
    "savedRecipes": []
  }
}
```

---

### 1.3 `POST /api/auth/login`
Authenticates an existing chef.

* **Request Body**:
```json
{
  "email": "durga@example.com",
  "password": "securepassword123"
}
```
* **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### 1.4 `POST /api/auth/demo-login`
Instant 1-click login as **Chef Durga** with pre-seeded taste profile.

* **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "demo-user-1",
    "name": "Chef Durga",
    "email": "chef@mise.kitchen",
    "avatar": "👨‍🍳",
    "dietaryPreferences": ["High Protein", "Gluten-Friendly"],
    "spicePreference": "Bold & Smoky",
    "kitchenStaples": ["Cultured Butter", "Garlic Confit", "Smoked Flake Salt", "Chili Crisp"],
    "savedRecipes": []
  }
}
```

---

### 1.5 `PUT /api/auth/preferences`
Updates dietary restrictions, spice level, and permanent kitchen staples.

* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Body**:
```json
{
  "dietaryPreferences": ["Vegetarian", "Dairy-Free"],
  "spicePreference": "Bold & Smoky Heat",
  "kitchenStaples": ["Olive Oil", "Garlic", "Butter", "Gochujang", "Chili Crisp"]
}
```
* **Response (200 OK)**:
```json
{
  "user": { ... }
}
```

---

### 1.6 `POST /api/auth/sync-recipes`
Merges guest recipes into the user's permanent cloud account.

* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Body**:
```json
{
  "recipes": [
    {
      "id": "sample-1",
      "title": "Smoked Garlic & Sweet Corn Sauté",
      "prepTime": "15 mins",
      "ingredients": [...],
      "instructions": [...]
    }
  ]
}
```
* **Response (200 OK)**:
```json
{
  "savedRecipes": [ ... ]
}
```

---

### 1.7 `GET /api/health`
Health check confirmation.
```json
{ "ok": true }
```

---

## 2. Database Mongoose Schemas

### User Schema (`backend/models/User.js`)
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "🧑‍🍳" },
  dietaryPreferences: { type: [String], default: [] },
  spicePreference: { type: String, default: "Medium Heat" },
  kitchenStaples: { type: [String], default: ["Olive Oil", "Flake Sea Salt", "Garlic", "Butter"] },
  savedRecipes: { type: [Object], default: [] },
}, { timestamps: true });
```

### Query Audit Schema (`backend/models/Query.js`)
```javascript
const QuerySchema = new mongoose.Schema({
  question: { type: String, required: true },
  response: { type: String, required: true },
}, { timestamps: true });
```
