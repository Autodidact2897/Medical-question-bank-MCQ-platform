-- Stores a logged-in user's LNA diagnostic results (weak areas, topic scores)
CREATE TABLE IF NOT EXISTS user_lna_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES quiz_sessions(id),
  total_correct INTEGER,
  total_questions INTEGER,
  overall_percentage DECIMAL(5,2),
  topic_scores JSONB,        -- [{ topic, subject, correct, total, percentage, level }]
  weak_areas JSONB,          -- [{ topic, subject, level }] sorted weakest first
  taken_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_user_lna_results_user_id ON user_lna_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lna_results_taken_at ON user_lna_results(user_id, taken_at DESC);

-- Index on user_answers for fast wrong-answer lookups
CREATE INDEX IF NOT EXISTS idx_user_answers_session_correct ON user_answers(session_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
