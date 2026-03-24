const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/lna/results — detailed LNA results with traffic light per subtopic
router.get('/results', async (req, res) => {
  const userId = req.user.id;

  try {
    // Get the most recent LNA results
    const lnaResult = await pool.query(`
      SELECT id, session_id, topic_scores, weak_areas, overall_percentage,
             total_correct, total_questions, taken_at
      FROM user_lna_results
      WHERE user_id = $1
      ORDER BY taken_at DESC
      LIMIT 1
    `, [userId]);

    if (lnaResult.rows.length === 0) {
      return res.json({
        success: true,
        data: { completed: false },
        error: null,
      });
    }

    const row = lnaResult.rows[0];
    const topicScores = row.topic_scores || [];

    // Get all LNA subjects for a complete picture
    const allSubjects = await pool.query(`
      SELECT DISTINCT subject, topic FROM questions WHERE lna = true ORDER BY subject, topic
    `);

    // Build a map of attempted topics
    const attemptedMap = {};
    for (const ts of topicScores) {
      attemptedMap[ts.topic] = ts;
    }

    // Merge: attempted topics get their status, unattempted get AMBER
    const fullBreakdown = allSubjects.rows.map(row => {
      const attempted = attemptedMap[row.topic];
      if (attempted) {
        return {
          subject: row.subject,
          topic: row.topic,
          status: attempted.level === 'green' ? 'GREEN' : attempted.level === 'red' ? 'RED' : 'AMBER',
          percentage: attempted.percentage,
          correct: attempted.correct,
          total: attempted.total,
        };
      }
      return {
        subject: row.subject,
        topic: row.topic,
        status: 'AMBER',
        percentage: null,
        correct: 0,
        total: 0,
      };
    });

    // Group by subject
    const bySubject = {};
    for (const item of fullBreakdown) {
      if (!bySubject[item.subject]) bySubject[item.subject] = [];
      bySubject[item.subject].push(item);
    }

    // Focus areas (RED topics)
    const focusAreas = fullBreakdown.filter(t => t.status === 'RED');

    return res.json({
      success: true,
      data: {
        completed: true,
        overallPercentage: parseFloat(row.overall_percentage),
        totalCorrect: row.total_correct,
        totalQuestions: row.total_questions,
        takenAt: row.taken_at,
        bySubject,
        focusAreas,
        topicScores,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching LNA results:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch LNA results', data: null });
  }
});

// GET /api/lna/analytics — full question-by-question breakdown with platform comparison
router.get('/analytics', async (req, res) => {
  const userId = req.user.id;

  try {
    // Get most recent LNA session
    const lnaResult = await pool.query(`
      SELECT session_id, overall_percentage, topic_scores, taken_at
      FROM user_lna_results
      WHERE user_id = $1
      ORDER BY taken_at DESC
      LIMIT 1
    `, [userId]);

    if (lnaResult.rows.length === 0) {
      return res.json({ success: true, data: { completed: false }, error: null });
    }

    const { session_id, overall_percentage, topic_scores, taken_at } = lnaResult.rows[0];

    // Get every question answered in this LNA session
    const questionsResult = await pool.query(`
      SELECT ua.user_answer, ua.is_correct,
             q.id AS question_id, q.question_text, q.subject, q.topic,
             q.correct_answer, q.explanation, q.difficulty,
             q.option_a, q.option_b, q.option_c, q.option_d, q.option_e
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.session_id = $1
      ORDER BY q.subject, q.topic
    `, [session_id]);

    // Platform average LNA scores per subject
    const platformResult = await pool.query(`
      SELECT
        q.subject,
        COUNT(*)::int AS total,
        SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE q.lna = true
      GROUP BY q.subject
    `);

    const platformBySubject = {};
    for (const row of platformResult.rows) {
      platformBySubject[row.subject] = {
        total: row.total,
        correct: row.correct,
        percentage: row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0,
      };
    }

    // User's subject breakdown from topic_scores
    const userBySubject = {};
    for (const ts of (topic_scores || [])) {
      if (!userBySubject[ts.subject]) {
        userBySubject[ts.subject] = { correct: 0, total: 0 };
      }
      userBySubject[ts.subject].correct += ts.correct;
      userBySubject[ts.subject].total += ts.total;
    }

    const subjectComparison = Object.keys({ ...userBySubject, ...platformBySubject }).sort().map(subject => ({
      subject,
      userPercentage: userBySubject[subject]
        ? Math.round((userBySubject[subject].correct / userBySubject[subject].total) * 100)
        : 0,
      platformPercentage: platformBySubject[subject]?.percentage || 0,
    }));

    return res.json({
      success: true,
      data: {
        completed: true,
        overallPercentage: parseFloat(overall_percentage),
        takenAt: taken_at,
        questions: questionsResult.rows,
        subjectComparison,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching LNA analytics:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch LNA analytics', data: null });
  }
});

module.exports = router;
