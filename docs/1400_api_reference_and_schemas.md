# 1400 • API Reference & Data Schemas

## 1. REST API Endpoints

### 1.1 `POST /api/generate-recipe`
Generates top 3 distinct artisanal recipes from text ingredients or an uploaded fridge image.

* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "question": "Create 3 distinct elevated recipes using chicken thighs, sweet corn, garlic. Strict dietary preferences: High Protein.",
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." // Optional base64 photo
}
```
* **Response (200 OK)**:
```json
{
  "response": "# Smoked Garlic & Sweet Corn Sauté\n**Prep Time:** 15 mins | **Cook Time:** 10 mins...\n---RECIPE_DIVIDER---\n# Comforting Chicken & Corn Hearth Braised Bowl..."
}
```

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
