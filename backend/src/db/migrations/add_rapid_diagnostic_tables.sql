-- Rapid Diagnostic: separate question bank for the free LNA funnel
CREATE TABLE IF NOT EXISTS rapid_diagnostic_questions (
  id SERIAL PRIMARY KEY,
  rd_question_id VARCHAR NOT NULL,
  subject_tag VARCHAR NOT NULL,
  paper VARCHAR NOT NULL,
  question_type VARCHAR NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT,
  option_f TEXT,
  option_g TEXT,
  option_h TEXT,
  correct_answer VARCHAR(5) NOT NULL,
  explanation TEXT NOT NULL,
  difficulty VARCHAR NOT NULL DEFAULT 'Medium',
  teaser_text TEXT NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions: tracks each anonymous assessment attempt
CREATE TABLE IF NOT EXISTS rapid_diagnostic_sessions (
  id SERIAL PRIMARY KEY,
  session_token VARCHAR UNIQUE NOT NULL,
  email VARCHAR,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  total_correct INTEGER,
  total_questions INTEGER DEFAULT 20,
  overall_percentage DECIMAL(5,2),
  results_json JSONB
);

-- Individual answers per session
CREATE TABLE IF NOT EXISTS rapid_diagnostic_answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES rapid_diagnostic_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES rapid_diagnostic_questions(id),
  user_answer VARCHAR(5),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);
