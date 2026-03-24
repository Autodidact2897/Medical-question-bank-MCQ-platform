-- Flagged questions for review during quizzes
CREATE TABLE IF NOT EXISTS flagged_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_flagged_questions_session ON flagged_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_flagged_questions_user ON flagged_questions(user_id);
