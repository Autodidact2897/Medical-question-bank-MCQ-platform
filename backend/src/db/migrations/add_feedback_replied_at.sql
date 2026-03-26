-- Add replied_at column to question_feedback for tracking admin replies
ALTER TABLE question_feedback ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
