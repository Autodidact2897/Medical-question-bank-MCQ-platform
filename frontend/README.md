# DiscoLabs Frontend — Setup Guide

## Quick Start (run these commands in order)

```bash
# 1. Go into the project folder
cd discolabs-frontend

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Project Structure

```
src/
├── main.jsx              ← Entry point (don't touch)
├── App.jsx               ← All routes defined here
├── index.css             ← Global styles + Tailwind
├── contexts/
│   └── AuthContext.jsx   ← Login/logout state for whole app
├── lib/
│   └── api.js            ← All backend API calls go through here
├── components/
│   └── ProtectedRoute.jsx ← Guards pages that need login
└── pages/
    ├── LandingPage.jsx   ← / (public)
    ├── LnaQuiz.jsx       ← /lna-quiz (public)
    ├── LnaResults.jsx    ← /lna-results/:sessionId (public)
    ├── Login.jsx         ← /login (public)
    ├── Register.jsx      ← /register (public)
    ├── Dashboard.jsx     ← /dashboard (protected)
    ├── QuizPage.jsx      ← /quiz/:id (protected)
    ├── QuizResults.jsx   ← /quiz/:id/results (protected)
    ├── ClinicalBriefs.jsx ← /briefs (protected)
    └── SingleBrief.jsx   ← /briefs/:id (protected)
```

---

## Connecting to Your Backend

Your backend runs on `http://localhost:5000`.

The `vite.config.js` already has a proxy set up so any request to `/api/...`
in the frontend is forwarded to `http://localhost:5000/api/...` automatically.

**Make sure your backend is running before starting the frontend.**

---

## Building for Production (Vercel)

```bash
npm run build
```

Then deploy the `dist/` folder to Vercel. The `vercel.json` file handles
SPA routing so page refreshes work correctly.

---

## Environment Variables

If you need to change the backend URL for production, create a `.env` file:

```
VITE_API_URL=https://your-backend.com
```

Then update `src/lib/api.js`:
```js
baseURL: import.meta.env.VITE_API_URL + '/api'
```
