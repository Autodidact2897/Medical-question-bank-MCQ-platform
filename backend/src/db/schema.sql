-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_id VARCHAR,
  subject VARCHAR,
  topic VARCHAR,
  question_type VARCHAR,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  option_e TEXT,
  option_f TEXT,
  option_g TEXT,
  option_h TEXT,
  correct_answer VARCHAR(1),
  explanation TEXT,
  difficulty VARCHAR,
  lna BOOLEAN,
  date_added DATE
);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subject VARCHAR,
  total_questions INTEGER,
  score INTEGER,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES quiz_sessions(id),
  question_id INTEGER REFERENCES questions(id),
  user_answer VARCHAR(1),
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);
