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

// GET /api/questions (protected)
router.get('/questions', authMiddleware, async (req, res) => {
  console.log('Questions request received, user:', req.user.email);

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
