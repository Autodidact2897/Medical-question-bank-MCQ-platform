const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All quiz routes require auth
router.use(authMiddleware);

// POST /api/quiz/start
router.post('/start', async (req, res) => {
  console.log('Quiz start request');
  let { subject, topic, questionCount } = req.body;

  questionCount = parseInt(questionCount) || 10;
  if (questionCount > 50) questionCount = 50;

  try {
    // Build WHERE clause based on subject and/or topic
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (topic) {
      conditions.push(`topic = $${paramIndex}`);
      values.push(topic);
      paramIndex++;
    } else if (subject) {
      conditions.push(`subject = $${paramIndex}`);
      values.push(subject);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(questionCount);

    const questionsResult = await pool.query(`
      SELECT id, question_id, subject, topic, question_type, question_text,
             option_a, option_b, option_c, option_d, option_e,
             option_f, option_g, option_h,
             difficulty, lna, date_added
      FROM questions
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT $${paramIndex}
    `, values);

    const questions = questionsResult.rows;
    const label = topic || subject || 'all';
    console.log(`Fetched ${questions.length} questions for: ${label}`);

    // Create quiz session
    const sessionResult = await pool.query(`
      INSERT INTO quiz_sessions (user_id, subject, total_questions, score, completed)
      VALUES ($1, $2, $3, 0, false)
      RETURNING id
    `, [req.user.id, topic || subject || null, questions.length]);

    const sessionId = sessionResult.rows[0].id;
    console.log('Quiz session created, id:', sessionId);

    return res.json({
      success: true,
      data: { sessionId, questions },
      error: null,
    });
  } catch (err) {
    console.error('Error starting quiz:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to start quiz', data: null });
  }
});

// POST /api/quiz/:sessionId/answer
router.post('/:sessionId/answer', async (req, res) => {
  const { sessionId } = req.params;
  const { questionId, userAnswer } = req.body;
  console.log(`Answer submitted - session: ${sessionId}, question: ${questionId}, answer: ${userAnswer}`);

  if (!questionId || !userAnswer) {
    return res.status(400).json({ success: false, error: 'questionId and userAnswer are required', data: null });
  }

  const normalizedAnswer = userAnswer.toUpperCase();

  try {
    // Validate session belongs to this user
    const sessionResult = await pool.query(
      'SELECT id, user_id FROM quiz_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz session not found', data: null });
    }

    if (sessionResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorised to access this session', data: null });
    }

    // Get correct answer and explanation for the question
    const questionResult = await pool.query(
      'SELECT correct_answer, explanation FROM questions WHERE id = $1',
      [questionId]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found', data: null });
    }

    const { correct_answer, explanation } = questionResult.rows[0];
    const isCorrect = normalizedAnswer === correct_answer.toUpperCase();

    console.log(`Answer ${isCorrect ? 'correct' : 'incorrect'} (expected: ${correct_answer})`);

    // Save to user_answers
    await pool.query(`
      INSERT INTO user_answers (session_id, question_id, user_answer, is_correct)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, questionId, normalizedAnswer, isCorrect]);

    return res.json({
      success: true,
      data: { isCorrect, correctAnswer: correct_answer, explanation },
      error: null,
    });
  } catch (err) {
    console.error('Error submitting answer:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit answer', data: null });
  }
});

// POST /api/quiz/:sessionId/complete — marks session as done (called before results)
router.post('/:sessionId/complete', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`Complete requested for session: ${sessionId}`);

  try {
    const sessionResult = await pool.query(
      'SELECT id, user_id FROM quiz_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found', data: null });
    }

    if (sessionResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorised', data: null });
    }

    await pool.query(
      'UPDATE quiz_sessions SET completed = true, completed_at = NOW() WHERE id = $1',
      [sessionId]
    );

    return res.json({ success: true, data: { message: 'Session completed' }, error: null });
  } catch (err) {
    console.error('Error completing quiz:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to complete quiz', data: null });
  }
});

// GET /api/quiz/:sessionId/results
router.get('/:sessionId/results', async (req, res) => {
  const { sessionId } = req.params;
  console.log(`Results requested for session: ${sessionId}`);

  try {
    // Validate session belongs to this user
    const sessionResult = await pool.query(
      'SELECT id, user_id, subject, total_questions FROM quiz_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quiz session not found', data: null });
    }

    if (sessionResult.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorised to access this session', data: null });
    }

    const session = sessionResult.rows[0];

    // Get all answers for this session with question details
    const resultsResult = await pool.query(`
      SELECT
        ua.question_id,
        ua.user_answer,
        ua.is_correct,
        ua.answered_at,
        q.question_id   AS question_code,
        q.subject,
        q.topic,
        q.question_text,
        q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
        q.option_f, q.option_g, q.option_h,
        q.correct_answer,
        q.explanation,
        q.difficulty
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.session_id = $1
      ORDER BY ua.answered_at
    `, [sessionId]);

    const results = resultsResult.rows;
    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r.is_correct).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Mark session as completed and save score
    await pool.query(
      'UPDATE quiz_sessions SET completed = true, score = $1, completed_at = NOW() WHERE id = $2',
      [score, sessionId]
    );

    console.log(`Results: ${correctAnswers}/${totalQuestions} correct (${score}%)`);

    return res.json({
      success: true,
      data: { score, totalQuestions, correctAnswers, results },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching results:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch results', data: null });
  }
});

module.exports = router;
