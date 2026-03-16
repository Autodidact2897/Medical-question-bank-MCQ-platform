```
=================================================
MEDICAL QUESTION BANK - PROJECT SPECIFICATION
=================================================

PROJECT NAME:
Medical Question Bank

GOAL:
Build a subscription-based medical MCQ platform for medical students.
Charge £10/month for unlimited access.

MVP FEATURES (What to build first):
1. User authentication (email signup/login)
2. Browse questions by subject
3. Take quizzes (10 questions, timed 30 mins)
4. See score and explanations after quiz
5. Track progress (which topics student studied)
6. Stripe payment (£10/month subscription)
7. Curriculum-wide assessment (94 questions, identifies weak areas)

NOT IN MVP (Build later):
- Mobile app
- Discussion forum
- Video tutorials
- Spaced repetition reminders
- AI-powered study recommendations

TECH STACK:
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (on Railway)
- Hosting: Railway (backend) + Vercel (frontend)
- Payments: Stripe
- Monitoring: Sentry

MVP TIMELINE:
- Backend: Weeks 1-2
- Frontend: Week 3
- Testing & Launch: Week 4

CURRENT STATUS:
- [X] Apps downloaded (VS Code, Node.js, Git, Claude Code, Postman)
- [X] Accounts created (GitHub, Railway, Vercel, Stripe, Sentry, Claude Pro)
- [X] Design complete (wireframes reviewed)
- [X] Questions organized (medical_questions.csv)
- [ ] Project initialized (today)
- [ ] Backend built (next)
- [ ] Frontend built (next)
- [ ] Testing done (next)
- [ ] LAUNCHED!

MEDICAL QUESTIONS:
- File: MSRA_Master_Question_Bank.csv
- Total questions: 1000
- Subjects covered: Cardiovascular, Respiratory, Gastroenterology / Nutrition, Endocrinology / Metabolic, Psychiatry / Neurology, Musculoskeletal, Infectious Disease / Haematology / Immunology / Allergies / Genetics, Renal / Urology, Dermatology / ENT / Eyes, Reproductive, Paediatrics, Pharmacology & Therapeutics, Professional Integrity, Coping with Pressure, Empathy & Sensitivity
- Format: CSV with columns for SQuestion_ID,Subject,Topic,Question_Type,Question,Option_A,Option_B,Option_C,Option_D,Option_E,Option_F,Option_G,Option_H,Correct_Answer,Explanation,Difficulty,LNA,Date_Added

DESIGN APPROACH:
- Professional, clean, medical-themed
- Deep blue primary color (#1e40af)
- Progress bars showing student performance
- Personalized recommendations based on weak areas
- Mobile responsive

MVP SUCCESS LOOKS LIKE:
1. Students can sign up and log in
2. Students can browse medical questions by subject
3. Students can take timed 10-question quizzes
4. Students see their score and explanations
5. Students can pay $5/month and get access
6. You can see what's working (admin dashboard)
7. Platform runs 24/7 without errors

LAUNCH DATE GOAL:
[11/04/2026]
```