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

### 4. 🧑‍🍳 Authentication & 1-Click Fast Demo Profile
- **Built-in JWT + MongoDB Auth**: Secure account registration and password hashing with `bcryptjs`.
- **⚡ 1-Click Demo Login (`Chef Durga`)**: Instant authentication for rapid testing and hackathon presentations.
- **Guest-to-Cloud Sync**: Automatically merges all locally saved recipes into the user's cloud account upon login.

### 5. 🎯 Personalized Taste & Dietary Profile
- Configure dietary preferences (*Vegetarian, Vegan, Gluten-Free, Dairy-Free, Halal, Kosher, Nut-Free, High Protein, Low Carb / Keto, Under 500 kcal*).
- Set preferred **Spice Level** (*Mild, Medium, Bold & Smoky, Fiery Ghost Pepper*).
- Manage **Permanent Kitchen Staples** (*olive oil, butter, garlic confit, flake salt, gochujang, chili crisp*).
- Every recipe generated automatically honors the active chef's dietary profile.

### 6. 📸 "Snap Your Fridge" (AI Vision Scanner)
- Upload or take a picture of your open fridge or pantry.
- Powered by **Groq Vision (`llama-3.2-11b-vision-preview`)** to detect visible ingredients and formulate recipes automatically.

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
- **Groq API Key**: (Included in `.env` for `llama-3.1-8b-instant` and `llama-3.2-11b-vision-preview`)
- **MongoDB Atlas Connection** (Optional — fully operational with in-memory fallback)

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
JWT_SECRET=mise_secret_chef_jwt_key_2026
# Optional MongoDB URI:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mise
```

Start the backend server:
```bash
npm run dev
# Running on http://localhost:5000
```

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
