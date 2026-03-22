const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin emails — only these users can access admin routes
const ADMIN_EMAILS = ['benpopham43@sky.com'];

// Admin guard middleware
function adminOnly(req, res, next) {
  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required', data: null });
  }
  next();
}

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/admin/metrics — full site metrics dashboard
router.get('/metrics', async (req, res) => {
  console.log('Admin metrics requested by:', req.user.email);

  try {
    // Run all queries in parallel
    const [
      usersResult,
      newUsers7d,
      newUsers30d,
      sessionsResult,
      answersResult,
      rapidResult,
      subjectResult,
      topTopics,
      difficultyResult,
      dailyActivity,
      recentUsers,
      questionBankStats,
      activeLearners,
    ] = await Promise.all([
      // 1. Total users
      pool.query('SELECT COUNT(*)::int AS total FROM users'),

      // 2. New users last 7 days
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),

      // 3. New users last 30 days
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`),

      // 4. Quiz sessions
      pool.query(`
        SELECT
          COUNT(*)::int AS total_sessions,
          COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS completed_sessions,
          COALESCE(AVG(CASE WHEN completed THEN score END), 0)::numeric(5,1) AS avg_score,
          COALESCE(AVG(CASE WHEN completed THEN total_questions END), 0)::numeric(5,1) AS avg_questions_per_session
        FROM quiz_sessions
      `),

      // 5. Total answers
      pool.query(`
        SELECT
          COUNT(*)::int AS total_answers,
          COALESCE(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END), 0)::int AS total_correct
        FROM user_answers
      `),

      // 6. Rapid diagnostic sessions
      pool.query(`
        SELECT
          COUNT(*)::int AS total_started,
          COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS total_completed,
          COALESCE(AVG(CASE WHEN completed THEN score_percentage END), 0)::numeric(5,1) AS avg_score
        FROM rapid_diagnostic_sessions
      `),

      // 7. Performance by subject
      pool.query(`
        SELECT
          q.subject,
          COUNT(*)::int AS attempted,
          COALESCE(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END), 0)::int AS correct,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.subject
        ORDER BY attempted DESC
      `),

      // 8. Top 10 topics by attempts
      pool.query(`
        SELECT
          q.topic,
          q.subject,
          COUNT(*)::int AS attempted,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.topic, q.subject
        ORDER BY attempted DESC
        LIMIT 10
      `),

      // 9. Performance by difficulty
      pool.query(`
        SELECT
          q.difficulty,
          COUNT(*)::int AS attempted,
          COALESCE(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END), 0)::int AS correct,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage
        FROM user_answers ua
        JOIN questions q ON ua.question_id = q.id
        GROUP BY q.difficulty
        ORDER BY
          CASE q.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 ELSE 4 END
      `),

      // 10. Daily activity (last 30 days)
      pool.query(`
        SELECT
          date_trunc('day', ua.answered_at)::date AS day,
          COUNT(*)::int AS answers,
          COUNT(DISTINCT qs.user_id)::int AS active_users
        FROM user_answers ua
        JOIN quiz_sessions qs ON ua.session_id = qs.id
        WHERE ua.answered_at >= NOW() - INTERVAL '30 days'
        GROUP BY day
        ORDER BY day
      `),

      // 11. Recent signups
      pool.query(`
        SELECT id, email, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 10
      `),

      // 12. Question bank stats
      pool.query(`
        SELECT
          COUNT(*)::int AS total_questions,
          COUNT(DISTINCT subject)::int AS total_subjects,
          COUNT(DISTINCT topic)::int AS total_topics,
          COALESCE(SUM(CASE WHEN lna THEN 1 ELSE 0 END), 0)::int AS lna_questions
        FROM questions
      `),

      // 13. Most active learners (top 10)
      pool.query(`
        SELECT
          u.email,
          COUNT(ua.id)::int AS total_answers,
          ROUND(COALESCE(AVG(CASE WHEN ua.is_correct THEN 1.0 ELSE 0.0 END) * 100, 0))::int AS percentage,
          COUNT(DISTINCT qs.id)::int AS sessions
        FROM users u
        JOIN quiz_sessions qs ON qs.user_id = u.id
        JOIN user_answers ua ON ua.session_id = qs.id
        GROUP BY u.id, u.email
        ORDER BY total_answers DESC
        LIMIT 10
      `),
    ]);

    const { total_answers, total_correct } = answersResult.rows[0];
    const overall_correct_pct = total_answers > 0
      ? Math.round((total_correct / total_answers) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: usersResult.rows[0].total,
          new_7d: newUsers7d.rows[0].total,
          new_30d: newUsers30d.rows[0].total,
        },
        quiz_sessions: sessionsResult.rows[0],
        answers: {
          total: total_answers,
          correct: total_correct,
          overall_correct_pct,
        },
        rapid_diagnostic: rapidResult.rows[0],
        by_subject: subjectResult.rows,
        top_topics: topTopics.rows,
        by_difficulty: difficultyResult.rows,
        daily_activity: dailyActivity.rows,
        recent_users: recentUsers.rows,
        question_bank: questionBankStats.rows[0],
        active_learners: activeLearners.rows,
      },
    });
  } catch (err) {
    console.error('Admin metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to load admin metrics', data: null });
  }
});

module.exports = router;
