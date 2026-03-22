const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/subjects (public)
router.get('/subjects', async (req, res) => {
  console.log('Subjects request received');
  try {
    const result = await pool.query(`
      SELECT subject, COUNT(*) AS count
      FROM questions
      GROUP BY subject
      ORDER BY subject
    `);

    const subjects = result.rows.map(row => ({
      subject: row.subject,
      count: parseInt(row.count),
    }));

    console.log(`Returning ${subjects.length} subjects`);
    return res.json({ success: true, data: subjects, error: null });
  } catch (err) {
    console.error('Error fetching subjects:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch subjects', data: null });
  }
});

// GET /api/subjects-topics (public) — returns subjects grouped with their topics
router.get('/subjects-topics', async (req, res) => {
  console.log('Subjects-topics request received');
  try {
    const result = await pool.query(`
      SELECT subject, topic, COUNT(*) AS count
      FROM questions
      GROUP BY subject, topic
      ORDER BY subject, topic
    `);

    // Group by subject
    const subjects = {};
    for (const row of result.rows) {
      if (!subjects[row.subject]) subjects[row.subject] = [];
      subjects[row.subject].push({ topic: row.topic, count: parseInt(row.count) });
    }

    return res.json({ success: true, data: { subjects }, error: null });
  } catch (err) {
    console.error('Error fetching subjects-topics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch subjects', data: null });
  }
});

// GET /api/questions/lna/quiz (public — no auth required for free diagnostic)
router.get('/questions/lna/quiz', async (req, res) => {
  console.log('LNA quiz request received');

  try {
    // Fetch all 20 LNA questions
    const questionsResult = await pool.query(`
      SELECT id, question_id, subject, topic, question_type, question_text,
             option_a, option_b, option_c, option_d, option_e,
             option_f, option_g, option_h,
             difficulty, lna, date_added
      FROM questions
      WHERE lna = true
      ORDER BY RANDOM()
    `);

    const questions = questionsResult.rows;
    console.log(`LNA quiz: returning ${questions.length} questions`);

    // Create an anonymous quiz session (no user_id)
    const sessionResult = await pool.query(`
      INSERT INTO quiz_sessions (user_id, subject, total_questions, score, completed)
      VALUES (NULL, 'LNA Diagnostic', $1, 0, false)
      RETURNING id
    `, [questions.length]);

    const sessionId = sessionResult.rows[0].id;

    return res.json({
      success: true,
      data: { questions, sessionId },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching LNA questions:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to load LNA quiz', data: null });
  }
});

// GET /api/questions (protected)
router.get('/questions', authMiddleware, async (req, res) => {
  console.log('Questions request received');

  let { subject, difficulty, limit } = req.query;

  // Sanitise limit
  limit = parseInt(limit) || 10;
  if (limit > 50) limit = 50;

  const conditions = [];
  const values = [];

  if (subject) {
    values.push(subject);
    conditions.push(`subject = $${values.length}`);
  }

  if (difficulty) {
    values.push(difficulty);
    conditions.push(`difficulty = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  values.push(limit);
  const limitParam = `$${values.length}`;

  try {
    const result = await pool.query(`
      SELECT id, question_id, subject, topic, question_type, question_text,
             option_a, option_b, option_c, option_d, option_e,
             option_f, option_g, option_h,
             difficulty, lna, date_added
      FROM questions
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT ${limitParam}
    `, values);

    console.log(`Returning ${result.rows.length} questions`);
    return res.json({
      success: true,
      data: { questions: result.rows, total: result.rows.length },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch questions', data: null });
  }
});

module.exports = router;
