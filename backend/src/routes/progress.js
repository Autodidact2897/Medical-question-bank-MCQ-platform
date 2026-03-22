const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/progress — overall stats, subject/difficulty/topic breakdowns, recent sessions
router.get('/', async (req, res) => {
  const userId = req.user.id;
  console.log('Progress requested');

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

    // 4. Breakdown by topic (subtopic-level)
    const topicResult = await pool.query(`
      SELECT
        q.subject,
        q.topic,
        COUNT(*)::int AS attempted,
        SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
      GROUP BY q.subject, q.topic
      ORDER BY q.subject, q.topic
    `, [userId]);

    const by_topic = topicResult.rows.map(row => ({
      subject: row.subject,
      topic: row.topic,
      attempted: row.attempted,
      correct: row.correct,
      percentage: row.attempted > 0 ? Math.round((row.correct / row.attempted) * 100) : 0,
    }));

    // 5. Last 5 completed quiz sessions
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

    // 6. Total unique questions attempted (not just total answers)
    const uniqueResult = await pool.query(`
      SELECT COUNT(DISTINCT ua.question_id)::int AS unique_questions
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      WHERE qs.user_id = $1
    `, [userId]);

    const unique_questions = uniqueResult.rows[0].unique_questions;

    // 7. Total questions available in bank
    const bankResult = await pool.query('SELECT COUNT(*)::int AS total FROM questions');
    const total_in_bank = bankResult.rows[0].total;

    console.log(`Progress: ${total_attempted} attempted, ${overall_percentage}% correct, ${by_topic.length} topics`);

    return res.json({
      success: true,
      data: {
        total_attempted,
        total_correct,
        overall_percentage,
        unique_questions,
        total_in_bank,
        by_subject,
        by_difficulty,
        by_topic,
        recent_sessions,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching progress:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch progress', data: null });
  }
});

// GET /api/progress/wrong-answers — questions the user got wrong (most recent attempt per question)
router.get('/wrong-answers', async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const topic = req.query.topic || null;

  console.log('Wrong answers requested');

  try {
    // Get the most recent answer for each question, only where incorrect
    const conditions = ['qs.user_id = $1'];
    const values = [userId];
    let paramIndex = 2;

    if (topic) {
      conditions.push(`q.topic = $${paramIndex}`);
      values.push(topic);
      paramIndex++;
    }

    values.push(limit);

    const result = await pool.query(`
      SELECT DISTINCT ON (ua.question_id)
        ua.question_id,
        ua.user_answer,
        ua.is_correct,
        ua.answered_at,
        q.question_id AS question_code,
        q.subject,
        q.topic,
        q.question_text,
        q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
        q.correct_answer,
        q.explanation,
        q.difficulty
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ua.question_id, ua.answered_at DESC
    `, values.slice(0, -1));

    // Filter to only wrong answers and limit
    const wrongAnswers = result.rows
      .filter(r => !r.is_correct)
      .slice(0, limit);

    // Group by topic for summary
    const topicSummary = {};
    for (const row of wrongAnswers) {
      if (!topicSummary[row.topic]) {
        topicSummary[row.topic] = { topic: row.topic, subject: row.subject, count: 0 };
      }
      topicSummary[row.topic].count++;
    }

    console.log(`Wrong answers: ${wrongAnswers.length} questions`);

    return res.json({
      success: true,
      data: {
        total_wrong: wrongAnswers.length,
        by_topic: Object.values(topicSummary).sort((a, b) => b.count - a.count),
        questions: wrongAnswers,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching wrong answers:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch wrong answers', data: null });
  }
});

// POST /api/progress/lna-results — store LNA diagnostic results for a logged-in user
router.post('/lna-results', async (req, res) => {
  const userId = req.user.id;
  const { session_id } = req.body;

  console.log('Saving LNA results');

  try {
    // Get all answers from this quiz session with topic data
    const answersResult = await pool.query(`
      SELECT
        ua.is_correct,
        q.subject,
        q.topic
      FROM user_answers ua
      JOIN questions q ON ua.question_id = q.id
      WHERE ua.session_id = $1
    `, [session_id]);

    if (answersResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No answers found for this session', data: null });
    }

    const answers = answersResult.rows;
    const totalQuestions = answers.length;
    const totalCorrect = answers.filter(a => a.is_correct).length;
    const overallPercentage = Math.round((totalCorrect / totalQuestions) * 100);

    // Group by topic
    const topicMap = {};
    for (const ans of answers) {
      const key = ans.topic;
      if (!topicMap[key]) {
        topicMap[key] = { topic: key, subject: ans.subject, correct: 0, total: 0 };
      }
      topicMap[key].total++;
      if (ans.is_correct) topicMap[key].correct++;
    }

    // Calculate percentage and assign traffic light level
    const topicScores = Object.values(topicMap).map(t => {
      const pct = Math.round((t.correct / t.total) * 100);
      let level = 'green';
      if (pct < 40) level = 'red';
      else if (pct < 70) level = 'amber';
      return { ...t, percentage: pct, level };
    });

    // Sort weakest first
    topicScores.sort((a, b) => a.percentage - b.percentage);

    // Weak areas = red and amber topics
    const weakAreas = topicScores
      .filter(t => t.level !== 'green')
      .map(t => ({ topic: t.topic, subject: t.subject, level: t.level }));

    // Store in user_lna_results
    await pool.query(`
      INSERT INTO user_lna_results (user_id, session_id, total_correct, total_questions, overall_percentage, topic_scores, weak_areas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, session_id, totalCorrect, totalQuestions, overallPercentage,
        JSON.stringify(topicScores), JSON.stringify(weakAreas)]);

    console.log(`LNA results saved: ${totalCorrect}/${totalQuestions} (${overallPercentage}%), ${weakAreas.length} weak areas`);

    return res.json({
      success: true,
      data: {
        overall_percentage: overallPercentage,
        total_correct: totalCorrect,
        total_questions: totalQuestions,
        topic_scores: topicScores,
        weak_areas: weakAreas,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error saving LNA results:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to save LNA results', data: null });
  }
});

// GET /api/progress/lna-results — get the user's most recent LNA results
router.get('/lna-results', async (req, res) => {
  const userId = req.user.id;
  console.log('LNA results requested');

  try {
    const result = await pool.query(`
      SELECT topic_scores, weak_areas, overall_percentage, total_correct, total_questions, taken_at
      FROM user_lna_results
      WHERE user_id = $1
      ORDER BY taken_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        error: null,
      });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      data: {
        overall_percentage: parseFloat(row.overall_percentage),
        total_correct: row.total_correct,
        total_questions: row.total_questions,
        topic_scores: row.topic_scores,
        weak_areas: row.weak_areas,
        taken_at: row.taken_at,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching LNA results:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch LNA results', data: null });
  }
});

// GET /api/progress/study-history — what topics the user has studied and when
router.get('/study-history', async (req, res) => {
  const userId = req.user.id;
  console.log('Study history requested');

  try {
    // Topics studied with latest session date and performance
    const result = await pool.query(`
      SELECT
        q.subject,
        q.topic,
        COUNT(*)::int AS total_attempted,
        SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS total_correct,
        MAX(ua.answered_at) AS last_studied,
        COUNT(DISTINCT qs.id)::int AS sessions_count
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
      GROUP BY q.subject, q.topic
      ORDER BY MAX(ua.answered_at) DESC
    `, [userId]);

    // Get total available questions per topic
    const availableResult = await pool.query(`
      SELECT topic, COUNT(*)::int AS available
      FROM questions
      GROUP BY topic
    `);

    const availableMap = {};
    for (const row of availableResult.rows) {
      availableMap[row.topic] = row.available;
    }

    const history = result.rows.map(row => {
      const pct = row.total_attempted > 0 ? Math.round((row.total_correct / row.total_attempted) * 100) : 0;
      return {
        subject: row.subject,
        topic: row.topic,
        attempted: row.total_attempted,
        correct: row.total_correct,
        percentage: pct,
        available: availableMap[row.topic] || 0,
        coverage: availableMap[row.topic] ? Math.round((row.total_attempted / availableMap[row.topic]) * 100) : 0,
        last_studied: row.last_studied,
        sessions: row.sessions_count,
      };
    });

    // Topics NOT yet studied
    const studiedTopics = new Set(history.map(h => h.topic));
    const unstudied = availableResult.rows
      .filter(r => !studiedTopics.has(r.topic))
      .map(r => ({ topic: r.topic, available: r.available }))
      .sort((a, b) => a.topic.localeCompare(b.topic));

    return res.json({
      success: true,
      data: {
        studied: history,
        unstudied,
        total_topics_studied: history.length,
        total_topics_available: availableResult.rows.length,
      },
      error: null,
    });
  } catch (err) {
    console.error('Error fetching study history:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch study history', data: null });
  }
});

module.exports = router;
