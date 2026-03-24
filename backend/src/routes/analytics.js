const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/comparison (protected)
router.get('/comparison', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. User's overall correct percentage
    const userOverall = await pool.query(`
      SELECT COUNT(*) AS total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct
      FROM user_answers
      WHERE session_id IN (SELECT id FROM quiz_sessions WHERE user_id = $1)
    `, [userId]);

    const userTotal = parseInt(userOverall.rows[0].total) || 0;
    const userCorrect = parseInt(userOverall.rows[0].correct) || 0;
    const userPercentage = userTotal > 0 ? Math.round((userCorrect / userTotal) * 100) : 0;

    // 2. Platform average correct percentage
    const platformOverall = await pool.query(`
      SELECT COUNT(*) AS total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct
      FROM user_answers
    `);

    const platformTotal = parseInt(platformOverall.rows[0].total) || 0;
    const platformCorrect = parseInt(platformOverall.rows[0].correct) || 0;
    const platformPercentage = platformTotal > 0 ? Math.round((platformCorrect / platformTotal) * 100) : 0;

    // 3. Per-subject breakdown: user vs platform
    const userBySubject = await pool.query(`
      SELECT q.subject,
             COUNT(*) AS attempted,
             SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.session_id IN (SELECT id FROM quiz_sessions WHERE user_id = $1)
      GROUP BY q.subject
      ORDER BY q.subject
    `, [userId]);

    const platformBySubject = await pool.query(`
      SELECT q.subject,
             COUNT(*) AS attempted,
             SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      GROUP BY q.subject
      ORDER BY q.subject
    `);

    // Build a map of platform averages by subject
    const platformMap = {};
    for (const row of platformBySubject.rows) {
      const total = parseInt(row.attempted) || 0;
      const correct = parseInt(row.correct) || 0;
      platformMap[row.subject] = total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    const subjectComparison = userBySubject.rows.map(row => {
      const total = parseInt(row.attempted) || 0;
      const correct = parseInt(row.correct) || 0;
      return {
        subject: row.subject,
        userPercentage: total > 0 ? Math.round((correct / total) * 100) : 0,
        platformPercentage: platformMap[row.subject] || 0,
        attempted: total,
      };
    });

    // 4. User's percentile ranking
    // Get each user's correct percentage, then see where this user ranks
    const allUserScores = await pool.query(`
      SELECT qs.user_id,
             ROUND(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0) * 100) AS pct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      WHERE qs.user_id IS NOT NULL
      GROUP BY qs.user_id
      HAVING COUNT(*) >= 5
    `);

    const scores = allUserScores.rows.map(r => parseFloat(r.pct) || 0);
    const totalUsers = scores.length;
    const belowUser = scores.filter(s => s < userPercentage).length;
    const percentile = totalUsers > 0 ? Math.round((belowUser / totalUsers) * 100) : 50;

    return res.json({
      success: true,
      data: {
        userPercentage,
        platformPercentage,
        subjectComparison,
        percentile,
        totalUsersCompared: totalUsers,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching comparison analytics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch comparison data', data: null });
  }
});

module.exports = router;
