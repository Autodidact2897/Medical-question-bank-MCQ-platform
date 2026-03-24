-- Community question discussion comments
CREATE TABLE IF NOT EXISTS question_comments (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_comments_question ON question_comments(question_id);
CREATE INDEX IF NOT EXISTS idx_question_comments_user ON question_comments(user_id);
