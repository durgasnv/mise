# 🍳 MISE • Artisanal AI Culinary Kitchen & Pantry

> *Mise en place for every home cook. Turn whatever is in your fridge into elevated, restaurant-quality feasts.*

Inspired by the craft, wood smoke, and effortless hospitality of **Loro Asian Smokehouse & Bar**, **Mise** is a full-stack culinary studio that transforms everyday pantry items into mouth-watering, chef-curated meals in seconds.

---

## ✨ Key Features

### 1. 🎛️ Flexible Pantry Quantities & Freeform Input
- **`3 Items` (Quick Trio)**: Minimalist cooking for fast weeknight meals.
- **`5 Items` (Balanced Meal)**: Protein, produce, starch, fat, and aromatics.
- **`7 Items` (Feast Master)**: Complete multi-component dinner spreads.
- **`Freeform Text Box`**: Type or paste any random contents from your fridge (*e.g., "chicken thighs, sweet corn, garlic cloves, heavy cream, parmesan, fresh basil"*).
- **Dynamic Slot Editor**: Add or remove custom ingredient slots on the fly.

### 2. 🃏 Top 3 Stacked Recipe Deck
- Every generation crafts **3 distinct culinary styles** for your ingredients:
  - **Option 1**: Fast High-Heat Sauté / Pan Sear
  - **Option 2**: Comforting Hearth Braised Bowl / Soup
  - **Option 3**: Crispy Cast-Iron / Oven Roast
- **Stacked Card Deck UI**: Arranged one behind the other with visual depth and 1-click card flipping.

### 3. ⏱️ Interactive Hands-Free Cooking Mode
- **Giant Stove-Friendly Typography**: Designed to read from across the kitchen counter.
- **Smart Countdown Timers**: Automatically parses cooking times (*e.g. "Sear undisturbed for 3 minutes"*) into 1-click countdowns with `+1m` / `+3m` adjustments.
- **Harmonic Dinner Bell Chime**: Uses the Web Audio API oscillator synthesis to play an authentic dinner bell sound when any timer or recipe finishes.
- **Voice Step Reader**: Reads the instructions aloud using the browser's Text-to-Speech Web Speech API.
- **Keyboard Shortcuts**: Navigate with `Left / Right Arrow Keys` and toggle timers with `Spacebar`.

### 4. 🧑‍🍳 Puter Sign-In & Demo Preview
- **Generation authentication**: The browser sends its current Puter token; the backend verifies it with Puter and uses the returned account ID. Local profiles and legacy JWTs do not authorize generation.
- **Demo profile (`Chef Durga`)**: Explore the interface, saved starter recipes, and cooking previews. Live generation requires a permanent Puter account.
- **Shared usage limits**: MongoDB reserves per-account minute/day quotas and a global daily quota before contacting the generation provider.
- **Legacy password routes**: Disabled by default. Explicit enablement requires a random JWT secret of at least 32 characters; production also requires MongoDB. Public demo token issuance is disabled.

### 5. 🎯 Personalized Taste & Dietary Profile
- Configure dietary preferences (*Vegetarian, Vegan, Gluten-Free, Dairy-Free, Halal, Kosher, Nut-Free, High Protein, Low Carb / Keto, Under 500 kcal*).
- Set preferred **Spice Level** (*Mild, Medium, Bold & Smoky, Fiery Ghost Pepper*).
- Manage **Permanent Kitchen Staples** (*olive oil, butter, garlic confit, flake salt, gochujang, chili crisp*).
- Every recipe generated automatically honors the active chef's dietary profile.

### 6. 📸 "Snap Your Fridge" (AI Vision Scanner)
- Upload or take a picture of your open fridge or pantry.
- Uses an explicitly configured image-capable Groq model (`GROQ_VISION_MODEL`). Photo scanning is unavailable until a supported model is configured; users can enter ingredients instead.

### 7. 🎰 "Mystery Pantry Wheel" (Culinary Roulette Challenge)
- Spin 3 randomized culinary slot reels across Base Proteins, Fresh Produce, and Flavor Accents.
- 1-click loads the combination into the kitchen for instant AI cooking.

### 8. ⚖️ Dynamic Portion Scaler
- Toggle between **1x, 2x, 4x, 6x, or 8x portions**.
- Automatically recalculates all ingredient amounts, measurements, and fractions in real-time.

### 9. 🔄 "Smart Swap" 1-Click Ingredient Substitutions
- Click the **`🔄 Swap`** badge on any ingredient line to view 3 chef-curated alternatives (with substitution ratios and flavor profiles) and replace it in the recipe.

### 10. 🍸 Smokehouse Beverage & Companion Side Pairings
- Every recipe includes a craft drink pairing (*e.g. Charred Citrus Highball, Smoky Iced Green Tea*) and a quick 2-ingredient companion side (*e.g. Whipped Miso Butter with warm flatbread*).

### 11. 📸 Vintage Menu Card Exporter (Social Share)
- Generates a downloadable high-resolution **PNG postcard** styled with vintage typography, decorative borders, ingredients, and pairings via HTML5 Canvas.
- Native Web Share API integration for direct sharing to Instagram, WhatsApp, or iMessage.

### 12. 📖 Cookbook & Recipe Library
- Search recipes by keyword or filter by technique tags (*Quick Sauté, Comfort Bowl, Cast Iron, High Protein*).
- Instant save/bookmark status with feedback toast and undo-delete recovery.

---

## 🎨 Design System (Loro Inspired)

- **Canvas Palette**: Warm Canvas Cream (`#FBF0DF`, `#FFFDF9`), Deep Slate (`#334D66`), Smokehouse Coral (`#E56960`), Sage Olive (`#636951`), Salmon (`#FFBDA6`), Warm Amber (`#D89F43`).
- **Typography Suite**:
  - `DM Serif Display` — Headlines and brand identity
  - `Courier Prime` — Typewriter badges and kitchen tickets
  - `Plus Jakarta Sans` — Modern interface elements
  - `Lora` — Editorial body and chef notes
- **Tactile Elements**: Paper card textures, subtle drop shadows, ticker ribbons, and simmer loading animations.

---

## 🏗️ Architecture & Monorepo Structure

```
fridge2feast/
├── backend/
│   ├── api/
│   │   ├── auth.js            # Authentication, taste profile & sync endpoints
│   │   ├── generate-recipe.js # Groq text & vision AI generation pipeline
│   │   ├── health.js          # API health check endpoint
│   │   └── hello.js           # Test endpoint
│   ├── config/
│   │   └── database.js        # Mongoose MongoDB connection manager
│   ├── models/
│   │   ├── User.js            # User profile, dietary prefs & saved recipes
│   │   ├── Recipe.js          # Recipe schema
│   │   └── Query.js           # Generation query audit log
│   ├── package.json
│   └── server.js              # Node.js HTTP development & routing server
│
├── frontend/
│   ├── index.html             # Google Fonts & viewport configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx          # Sign in, register & 1-click demo modal
│   │   │   ├── CookingModeModal.jsx   # Fullscreen hands-free cooking assistant
│   │   │   ├── IngredientForm.jsx     # 3/5/7/freeform pantry selector
│   │   │   ├── MultiRecipeStack.jsx   # Top 3 stacked recipe card deck
│   │   │   ├── Navbar.jsx             # Header with chef avatar & tools
│   │   │   ├── PantryWheelModal.jsx   # Mystery roulette spinning game
│   │   │   ├── RecipeCard.jsx         # Artisanal menu recipe presentation
│   │   │   ├── SmartSwapModal.jsx     # Ingredient substitution drawer
│   │   │   ├── SocialShareModal.jsx   # Canvas postcard image exporter
│   │   │   └── TasteProfileModal.jsx  # Dietary preferences & staples manager
│   │   ├── lib/
│   │   │   ├── api.js                 # Recipe generation & health client
│   │   │   ├── auth.js                # Frontend session & auth state manager
│   │   │   ├── parseRecipes.js        # Multi-recipe parser, scaler & swaps
│   │   │   └── savedRecipes.js        # LocalStorage & cloud cookbook manager
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Kitchen workbench studio
│   │   │   ├── LandingPage.jsx        # Smokehouse hero & feature showcase
│   │   │   ├── SavedPage.jsx          # Cookbook gallery & search
│   │   │   └── SavedRecipePage.jsx    # Full-screen recipe viewer & print mode
│   │   ├── App.jsx                    # View routing & auth protection controller
│   │   ├── index.css                  # Tailwind styles & print CSS
│   │   └── main.jsx
│   ├── tailwind.config.js             # Loro color palette & font configuration
│   ├── vite.config.js                 # Vite bundler & API proxy configuration
│   └── package.json
│
└── README.md
```

---

## 🚀 Setup & Local Development

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **Groq API Key**: Configure it server-side. Text defaults to `openai/gpt-oss-20b`; model IDs can be changed through environment variables.
- **MongoDB connection**: Required for shared generation quotas. An unavailable quota database stops generation; there is no memory fallback for quotas.

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Ensure `backend/.env` contains:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
GROQ_TEXT_MODEL=openai/gpt-oss-20b
# Optional: choose a supported vision model available to your Groq account.
GROQ_VISION_MODEL=
JWT_SECRET=your_long_random_secret
ENABLE_LEGACY_AUTH=false
GENERATION_USER_MINUTE_LIMIT=5
GENERATION_USER_DAY_LIMIT=20
GENERATION_GLOBAL_DAY_LIMIT=200
# Required for generation quotas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mise
```

Start the backend server:
```bash
npm run dev
# Running on http://localhost:5000
```

Run `npm run check:models` from `backend/` to check configured model availability without generating recipes. Availability does not verify image capability; confirm that in provider documentation.

Generation rejects invalid/oversized inputs and displays provider failures instead of substituting generic recipes. It requires verified Puter identity, reserves shared MongoDB quotas, retains a process-local admission limit of 20 requests per minute, and bounds output to 4,096 completion tokens. Default shared limits are 5 requests per account per minute, 20 per account per UTC day, and 200 globally per UTC day. Failed admitted attempts consume quota; quota reservations are not refunded. Limits must be configured consistently across deployment instances. A global request allowance is not a monetary provider spending cap—configure that separately in the provider account.

Set `MONGODB_URI` (or `MONGO_URI`) on the backend/deployment. Its database user needs read/write access to `generation_quotas` and permission to create its TTL index. Index setup and quota-storage errors stop generation. The TTL index removes old buckets; window IDs determine reset times independently of deletion timing.

Run `npm --prefix backend test` and `npm --prefix frontend test` for mocked regression checks. To run the live quota concurrency test against an explicitly chosen test database, set `MONGO_QUOTA_TEST_URI` before the backend tests. That test uses and cleans up only a uniquely named collection, and never defaults to the application's database URI. See [the findings and implementation plan](docs/1600_findings_and_fix_plan.md) for verification results and remaining fixes.

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Ensure `frontend/.env` contains:
```env
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
# Running on http://localhost:5173
```

---

### 3. Production Build

To verify and compile production-ready static assets:
```bash
cd frontend
npm run build
```

---

## 📡 API Reference

### `POST /api/generate-recipe`
Generates top 3 culinary recipes from text ingredients or base64 fridge image.

**Request Body:**
```json
{
  "question": "Create 3 distinct elevated recipes using chicken thighs, sweet corn, garlic",
  "image": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "response": "# Smoked Garlic & Sweet Corn Sauté\n**Prep Time:** 15 mins..."
}
```

---

### `POST /api/auth/register`
Creates a new chef account and returns a JWT token.

---

### `POST /api/auth/login`
Authenticates an existing chef.

---

### `POST /api/auth/demo-login`
Instant 1-click authentication as **Chef Durga** with pre-configured taste profile.

---

### `PUT /api/auth/preferences`
Updates dietary restrictions, spice level, and permanent kitchen staples.

---

### `POST /api/auth/sync-recipes`
Merges guest recipes into the user's cloud cookbook.

---

### `GET /api/health`
Health check confirmation.
```json
{ "ok": true }
```

---

## 📄 License & Credits

- **Crafted with**: React, Vite, Tailwind CSS, Framer Motion, Groq Cloud, and Node.js.
- **Design Inspiration**: Loro Asian Smokehouse & Bar.
