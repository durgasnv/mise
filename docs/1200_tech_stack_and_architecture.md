# 1200 • Tech Stack & System Architecture

## Architecture Overview

Mise is built as a modern, high-performance monorepo featuring a decoupled React frontend and a lightweight Node.js serverless API backend powered by Groq Cloud AI and MongoDB Atlas.

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT APPLICATION                   │
│  React 18 + Vite + Tailwind CSS + Framer Motion        │
│  Web Audio API • Web Speech API • HTML5 Canvas         │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (Fetch API)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   BACKEND API SERVER                   │
│  Node.js HTTP Serverless Microservice                  │
│  JWT Authentication • bcryptjs • Route Dispatcher     │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     GROQ CLOUD AI ENGINE  │  │   MONGODB ATLAS / MONGODB│
│  llama-3.1-8b-instant     │  │   User Profiles, Taste  │
│  llama-3.2-11b-vision     │  │   Cookbook & Audit Logs │
└───────────────────────────┘  └─────────────────────────┘
```

---

## 1. Frontend Technology Stack

| Layer / Tool | Technology | Purpose |
|---|---|---|
| **Framework** | **React 18** | Component architecture, state hooks, and virtual DOM rendering |
| **Build Tool & Bundler** | **Vite 6** | Ultra-fast Hot Module Replacement (HMR) and optimized production rollup |
| **Styling & Design** | **Tailwind CSS v3** | Custom color tokens (`cream`, `slate`, `coral`, `salmon`, `sage`, `amber`), fluid typography |
| **Motion & Transitions** | **Framer Motion** | Page transitions, modal spring physics, card depth stacking |
| **Audio Engine** | **Web Audio API** | Real-time oscillator synthesis (523.25 Hz - 1046.5 Hz) for kitchen dinner bell chime |
| **Voice & Dictation** | **Web Speech API** | `SpeechRecognition` for voice pantry input and `speechSynthesis` for audio step reading |
| **Graphics Exporter** | **HTML5 Canvas 2D** | Postcard image rendering with custom typography and 1-click PNG generation |
| **State & Persistence** | **LocalStorage & Events** | Client-side cookbook cache and reactive `CustomEvent` cross-component sync |

---

## 2. Backend Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| **Runtime** | **Node.js (ES Modules)** | Serverless HTTP request handling and lightweight API router |
| **AI LLM Engine** | **Groq Cloud API** | Ultra-low-latency inference (llama-3.1-8b-instant for text, llama-3.2-11b-vision for photos) |
| **Database** | **MongoDB Atlas** | Cloud document storage for user profiles, preferences, and saved recipes |
| **ODM** | **Mongoose 8** | Schema validation, indexes, and resilient connection pooling |
| **Authentication** | **JWT & bcryptjs** | Stateless Bearer token verification and 10-round salted password hashing |
| **Configuration** | **dotenv** | Secure environment variable management |

---

## 3. High-Resilience & Offline Fallback Architecture

To ensure Mise **never crashes or presents a blank error screen** during live demos or offline environments:

1. **Non-Buffered MongoDB Connection**:
   - `mongoose.set("bufferCommands", false)` prevents backend requests from hanging if a MongoDB database is temporarily unreachable.
2. **In-Memory User & Recipe Store**:
   - If MongoDB Atlas is unconfigured, the backend automatically switches to an in-memory user map and session cache with the pre-seeded `Chef Durga` demo profile.
3. **Culinary Fallback Recipe Synthesizer**:
   - If the Groq API exceeds rate limits or encounters network timeouts (25s ceiling), the client seamlessly invokes `createFallbackRecipes()`, returning 3 distinct chef-grade recipes tailored to the user's specific ingredients.

---

## 4. Security & Best Practices

* **Zero Hardcoded Secrets**: All API keys (`GROQ_API_KEY`, `JWT_SECRET`, `MONGODB_URI`) are loaded via environment variables.
* **Stateless Authentication**: JWT tokens with 30-day expiration stored securely in the client session.
* **CORS & Input Sanitization**: Explicit CORS headers and input string trimming on all endpoints.
* **Production Build Metrics**: Gzipped client bundle under 115 kB for instant initial load times.
