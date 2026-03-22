-- Tracks which users have opted in to receive email briefs
CREATE TABLE IF NOT EXISTS email_subscribers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed ON email_subscribers(subscribed);

-- Stores composed email briefs that admin can draft, edit, and send
CREATE TABLE IF NOT EXISTS email_briefs (
  id SERIAL PRIMARY KEY,
  subject_line VARCHAR(255) NOT NULL,
  preview_text VARCHAR(255),
  body_html TEXT NOT NULL,
  body_text TEXT,
  topic VARCHAR(255),
  msra_subject VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',  -- draft | sent
  sent_at TIMESTAMP,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
