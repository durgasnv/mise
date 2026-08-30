# Fridge2Feast

## Project Overview

Fridge2Feast is an AI-powered recipe generator that turns any three pantry ingredients into a full, structured recipe. Users enter three ingredients, and the app instantly generates a dish name, prep time, ingredients list, and step-by-step instructions — all crafted by a large language model. Every generated recipe is saved to the database for persistence. The app is designed with an Italian aesthetic, keeping the experience minimal, fast, and elegant.

## Key Features

- Enter any 3 ingredients to generate a unique recipe
- AI-generated recipe with name, prep time, ingredients, and instructions
- Fallback recipe returned if the AI fails — it never crashes
- Every recipe saved to the database automatically
- Clean, responsive single-page UI with an Italian theme

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS
- Deployed on Vercel

### Backend
- Node.js (ES Modules)
- Vercel Serverless Functions
- Groq API — llama-3.1-8b-instant
- dotenv for environment configuration
- Deployed on Vercel

### Database
- MongoDB Atlas (cloud-hosted)
- Mongoose ODM

## Project Structure

```
Fridge2Feast/
├── frontend/        # React + Vite client
└── backend/         # Node.js serverless functions
    ├── api/         # Vercel function handlers
    ├── models/      # Mongoose models
    └── config/      # Database connection
```

## Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Groq API key

### Backend
```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:
```
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_connection_string
```

```bash
npm run dev
```

### Frontend
```bash
cd frontend
npm install
```

Create a `.env` file in `/frontend`:
```
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

## Deployment Steps

Both frontend and backend are deployed as separate Vercel projects from the same repository.

### Backend (Vercel)
1. Import the repository on Vercel
2. Set root directory to `backend`
3. Add environment variables: `GROQ_API_KEY`, `MONGODB_URI`
4. Deploy

### Frontend (Vercel)
1. Import the same repository on Vercel as a new project
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.vercel.app`
4. Deploy

## API Usage

### POST /api/generate-recipe

Accepts a user question or ingredient list and returns an AI-generated recipe.

**Request**
```json
{
  "question": "What can I make with tomato, garlic and pasta?"
}
```

**Response**
```json
{
  "response": "**Spaghetti Aglio e Olio**\n\n**Prep Time:** 15 minutes..."
}
```

**Error Response**
```json
{
  "error": "question is required."
}
```

### GET /api/health

Returns a health check confirmation.

```json
{ "ok": true }
```

## Security Practices

- API keys stored in environment variables, never in source code
- CORS headers set explicitly on all API responses
- Input validated before processing
- No sensitive data exposed in client-side code
