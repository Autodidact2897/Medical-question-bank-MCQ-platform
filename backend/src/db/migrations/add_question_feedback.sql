-- Question feedback / error reporting
CREATE TABLE IF NOT EXISTS question_feedback (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_feedback_question ON question_feedback(question_id);
