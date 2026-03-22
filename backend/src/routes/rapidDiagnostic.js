const express = require('express');
const crypto = require('crypto');
const pool = require('../db/connection');

const router = express.Router();

// GET /api/rapid-diagnostic/start
router.get('/start', async (req, res) => {
  console.log('Rapid Diagnostic: start requested');

  try {
    const sessionToken = crypto.randomUUID();

    // Create session
    await pool.query(
      `INSERT INTO rapid_diagnostic_sessions (session_token) VALUES ($1)`,
      [sessionToken]
    );

    // Fetch questions — DO NOT return correct_answer, explanation, or teaser_text
    const result = await pool.query(`
      SELECT id, rd_question_id, question_type, paper, question_text,
             option_a, option_b, option_c, option_d, option_e,
             option_f, option_g, option_h
      FROM rapid_diagnostic_questions
      ORDER BY RANDOM()
    `);

    console.log(`Rapid Diagnostic: session ${sessionToken}, ${result.rows.length} questions`);

    return res.json({
      success: true,
      data: {
        session_token: sessionToken,
        questions: result.rows,
      },
    });
  } catch (err) {
    console.error('Rapid Diagnostic start error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to start assessment' });
  }
});

// POST /api/rapid-diagnostic/answer
router.post('/answer', async (req, res) => {
  const { session_token, question_id, user_answer } = req.body;

  if (!session_token || !question_id || !user_answer) {
    return res.status(400).json({ success: false, error: 'session_token, question_id, and user_answer are required' });
  }

  try {
    // Validate session
    const sessionResult = await pool.query(
      'SELECT id FROM rapid_diagnostic_sessions WHERE session_token = $1',
      [session_token]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const sessionId = sessionResult.rows[0].id;

    // Get correct answer
    const questionResult = await pool.query(
      'SELECT correct_answer, question_type FROM rapid_diagnostic_questions WHERE id = $1',
      [question_id]
    );
    if (questionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    const { correct_answer, question_type } = questionResult.rows[0];
    const normalizedAnswer = user_answer.toUpperCase();
    const isCorrect = normalizedAnswer === correct_answer.toUpperCase();

    console.log(`Rapid Diagnostic: Q${question_id} answer=${normalizedAnswer} correct=${isCorrect}`);

    // Save answer
    await pool.query(`
      INSERT INTO rapid_diagnostic_answers (session_id, question_id, user_answer, is_correct)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, question_id, normalizedAnswer, isCorrect]);

    // Return ONLY is_correct — no correct answer, no explanation
    return res.json({ success: true, data: { is_correct: isCorrect } });
  } catch (err) {
    console.error('Rapid Diagnostic answer error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit answer' });
  }
});

// POST /api/rapid-diagnostic/complete
router.post('/complete', async (req, res) => {
  const { session_token, email } = req.body;

  if (!session_token || !email) {
    return res.status(400).json({ success: false, error: 'session_token and email are required' });
  }

  try {
    // Get session
    const sessionResult = await pool.query(
      'SELECT id FROM rapid_diagnostic_sessions WHERE session_token = $1',
      [session_token]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const sessionId = sessionResult.rows[0].id;

    // Get all answers with question data
    const answersResult = await pool.query(`
      SELECT rda.is_correct, rdq.subject_tag, rdq.teaser_text
      FROM rapid_diagnostic_answers rda
      JOIN rapid_diagnostic_questions rdq ON rda.question_id = rdq.id
      WHERE rda.session_id = $1
    `, [sessionId]);

    const answers = answersResult.rows;
    const totalQuestions = answers.length;
    const totalCorrect = answers.filter(a => a.is_correct).length;
    const overallPercentage = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // Group by subject
    const subjectMap = {};
    for (const ans of answers) {
      const subj = ans.subject_tag;
      if (!subjectMap[subj]) {
        subjectMap[subj] = { correct: 0, total: 0, teasers: new Set() };
      }
      subjectMap[subj].total++;
      if (ans.is_correct) subjectMap[subj].correct++;
      if (ans.teaser_text) subjectMap[subj].teasers.add(ans.teaser_text);
    }

    // Assign colour and build scores
    const subjectScores = [];
    for (const [subject, data] of Object.entries(subjectMap)) {
      let colour;
      if (data.total >= 2) {
        if (data.correct === 0) colour = 'RED';
        else if (data.correct === data.total) colour = 'GREEN';
        else colour = 'AMBER';
      } else {
        // 1 question
        colour = data.correct === 1 ? 'GREEN' : 'AMBER';
      }
      subjectScores.push({
        subject,
        correct: data.correct,
        total: data.total,
        colour,
        teasers: [...data.teasers],
      });
    }

    // Sort: RED first, then AMBER, then GREEN
    const colourOrder = { RED: 0, AMBER: 1, GREEN: 2 };
    subjectScores.sort((a, b) => colourOrder[a.colour] - colourOrder[b.colour]);

    // Pick top 3 weakest
    const weakAreas = subjectScores
      .filter(s => s.colour !== 'GREEN')
      .slice(0, 3)
      .map(s => ({
        subject: s.subject,
        teaser: s.teasers.join(' '),
        colour: s.colour,
      }));

    const lockedFeatures = [
      'Full subtopic-level breakdown',
      'Ranked weakness list across 60 subtopics',
      'Personalised revision pathway',
      'Teaching explanations for every question',
      '2,000-question practice bank',
    ];

    const resultsData = {
      overall_percentage: overallPercentage,
      total_correct: totalCorrect,
      total_questions: totalQuestions,
      subject_scores: subjectScores.map(s => ({
        subject: s.subject,
        correct: s.correct,
        total: s.total,
        colour: s.colour,
      })),
      weak_areas: weakAreas,
      locked_features: lockedFeatures,
    };

    // Update session
    await pool.query(`
      UPDATE rapid_diagnostic_sessions
      SET email = $1, completed_at = NOW(), total_correct = $2,
          overall_percentage = $3, results_json = $4
      WHERE id = $5
    `, [email, totalCorrect, overallPercentage, JSON.stringify(resultsData), sessionId]);

    console.log(`Rapid Diagnostic: completed, ${totalCorrect}/${totalQuestions} (${overallPercentage}%)`);

    return res.json({ success: true, data: resultsData });
  } catch (err) {
    console.error('Rapid Diagnostic complete error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to complete assessment' });
  }
});

// GET /api/rapid-diagnostic/results/:session_token
router.get('/results/:session_token', async (req, res) => {
  const { session_token } = req.params;

  try {
    const result = await pool.query(
      'SELECT results_json, email FROM rapid_diagnostic_sessions WHERE session_token = $1 AND completed_at IS NOT NULL',
      [session_token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Results not found' });
    }

    const { results_json, email } = result.rows[0];

    // Check if this email has a paid subscription — if so, include explanations
    let explanations = null;
    if (email) {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      // For now, just return free results. Subscription check can be added later.
    }

    return res.json({ success: true, data: results_json });
  } catch (err) {
    console.error('Rapid Diagnostic results error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch results' });
  }
});

module.exports = router;
