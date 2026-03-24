-- Add answered_count to quiz_sessions for partial completion tracking
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS answered_count INTEGER;

-- Add is_lna_session to distinguish LNA sessions from regular ones
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS is_lna_session BOOLEAN DEFAULT false;
