# Medical QBank — Project Rules for Claude Code

## What We're Building
A UK medical SBA question bank website for MSRA exam preparation.
All clinical content references NICE, BNF, SIGN, and GMC guidelines only.
No US guidelines (no UpToDate, no AHA, no USMLE content).

## Tech Stack
- Frontend: React + Vite + plain CSS (no TypeScript for now)
- Backend: Node.js + Express
- Database: PostgreSQL (on Railway cloud - NOT local)
- Frontend hosting: Vercel
- Backend hosting: Railway
- Error monitoring: Sentry

## Exact Database Schema to Use

### questions table
- id (SERIAL PRIMARY KEY)
- question_id (VARCHAR) — e.g. "IHD_001"
- subject (VARCHAR) — e.g. "Cardiovascular"
- topic (VARCHAR) — e.g. "Ischaemic Heart Disease"
- question_type (VARCHAR) — e.g. "SBA"
- question_text (TEXT)
- option_a (TEXT)
- option_b (TEXT)
- option_c (TEXT)
- option_d (TEXT)
- option_e (TEXT) — may be empty
- option_f (TEXT) — usually empty
- option_g (TEXT) — usually empty
- option_h (TEXT) — usually empty
- correct_answer (VARCHAR(1)) — single letter: A, B, C, D, or E
- explanation (TEXT)
- difficulty (VARCHAR) — Easy, Medium, or Hard
- lna (BOOLEAN) — true if Learning Need Area
- date_added (DATE)

### users table
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE NOT NULL)
- password_hash (VARCHAR NOT NULL)
- created_at (TIMESTAMP DEFAULT NOW())

### quiz_sessions table
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- subject (VARCHAR)
- total_questions (INTEGER)
- score (INTEGER)
- completed (BOOLEAN DEFAULT false)
- started_at (TIMESTAMP DEFAULT NOW())
- completed_at (TIMESTAMP)

### user_answers table
- id (SERIAL PRIMARY KEY)
- session_id (INTEGER REFERENCES quiz_sessions)
- question_id (INTEGER REFERENCES questions)
- user_answer (VARCHAR(1))
- is_correct (BOOLEAN)
- answered_at (TIMESTAMP DEFAULT NOW())

## API Response Format
All API responses must follow this format:
{ "success": true/false, "data": {...}, "error": null/"message" }

## Security Rules
- Hash passwords with bcrypt (10 salt rounds)
- Use JWT tokens (expire 24 hours), stored in HttpOnly cookies
- Validate all user input
- Use parameterized queries (never string concatenation in SQL)
- Store secrets in .env file, never hardcode them

## Code Style
- Use async/await throughout
- All routes in separate files in /routes folder
- Use dotenv for environment variables
- Add console.log statements so we can see what's happening

## CSV File Location
The question CSV is at: ./data/MSRA_Master_Question_Bank.csv