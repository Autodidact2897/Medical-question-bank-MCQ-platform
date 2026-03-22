const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/progress
router.get('/', async (req, res) => {
  const userId = req.user.id;
  console.log('Progress requested for user:', req.user.email);

  try {
    // 1. Overall stats
    const overallResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_attempted,
        COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS total_correct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      WHERE qs.user_id = $1
    `, [userId]);

    const { total_attempted, total_correct } = overallResult.rows[0];
    const overall_percentage = total_attempted > 0
      ? Math.round((total_correct / total_attempted) * 100)
      : 0;

    // 2. Breakdown by subject
    const subjectResult = await pool.query(`
      SELECT
        q.subject,
        COUNT(*)::int AS attempted,
        SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
      GROUP BY q.subject
      ORDER BY q.subject
    `, [userId]);

    const by_subject = subjectResult.rows.map(row => ({
      subject: row.subject,
      attempted: row.attempted,
      correct: row.correct,
      percentage: row.attempted > 0 ? Math.round((row.correct / row.attempted) * 100) : 0,
    }));

    // 3. Breakdown by difficulty
    const difficultyResult = await pool.query(`
      SELECT
        q.difficulty,
        COUNT(*)::int AS attempted,
        SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
      GROUP BY q.difficulty
      ORDER BY
        CASE q.difficulty
          WHEN 'Easy' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Hard' THEN 3
          ELSE 4
        END
    `, [userId]);

    const by_difficulty = difficultyResult.rows.map(row => ({
      difficulty: row.difficulty,
      attempted: row.attempted,
      correct: row.correct,
      percentage: row.attempted > 0 ? Math.round((row.correct / row.attempted) * 100) : 0,
    }));

    // 4. Last 5 completed quiz sessions
    const recentResult = await pool.query(`
      SELECT
        qs.id,
        qs.subject,
        qs.score,
        qs.total_questions,
        qs.completed_at
      FROM quiz_sessions qs
      WHERE qs.user_id = $1 AND qs.completed = true
      ORDER BY qs.completed_at DESC
      LIMIT 5
    `, [userId]);

    const recent_sessions = recentResult.rows.map(row => ({
      id: row.id,
      subject: row.subject || 'Mixed',
      score: row.score,
      total_questions: row.total_questions,
      completed_at: row.completed_at,
    }));

    console.log(`Progress: ${total_attempted} attempted, ${overall_percentage}% correct, ${by_subject.length} subjects`);

    return res.json({
      success: true,
      data: {
        total_attempted,
        total_correct,
        overall_percentage,
        by_subject,
        by_difficulty,
        recent_sessions,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching progress:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch progress', data: null });
  }
});

module.exports = router;
