```markdown
# Medical Question Bank - Project Rules

## Overview
Building a medical MCQ platform for students. MVP includes auth, quizzes, progress tracking, and $5/month Stripe subscription.

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL on Railway
- Payments: Stripe
- Hosting: Railway (backend) + Vercel (frontend)

## Database Setup
Create these tables:
- users (id, email, password_hash, subscription_status, created_at)
- subjects (id, name, description)
- questions (id, subject_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, difficulty)
- quiz_sessions (id, user_id, subject_id, score, created_at)
- user_answers (id, quiz_session_id, question_id, user_answer, is_correct)

## API Endpoints (Priority Order)
1. POST /api/auth/signup - Create account
2. POST /api/auth/login - Login
3. GET /api/subjects - List all subjects
4. GET /api/subjects/:id/questions - Get questions
5. POST /api/quizzes - Start quiz
6. POST /api/quizzes/:id/answer - Submit answer
7. GET /api/quizzes/:id/results - Get results

## Code Style
- Use TypeScript for type safety
- All responses: { success: boolean, data: any, error: string | null }
- Use async/await (no callbacks)
- Password hashing with bcrypt
- JWT auth with HttpOnly cookies

## Security Requirements
- Hash passwords with bcrypt
- JWT tokens expire after 24 hours
- Validate all user input
- Prevent SQL injection (use parameterized queries)
- HTTPS only (automatic with Railway/Vercel)
- Never log passwords or sensitive data

## Next Steps
1. Build Express server with basic structure
2. Set up PostgreSQL connection
3. Build auth endpoints
4. Build quiz endpoints
5. Import medical_questions.csv to database
```