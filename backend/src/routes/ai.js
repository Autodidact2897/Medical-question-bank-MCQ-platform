const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// In-memory rate limit store: userId -> [timestamps]
const rateLimitMap = new Map();
const DAILY_LIMIT = 5;

function checkRateLimit(userId) {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => t > dayAgo);
  rateLimitMap.set(userId, timestamps);
  if (timestamps.length >= DAILY_LIMIT) return false;
  timestamps.push(now);
  return true;
}

// POST /api/ai/study-suggestion
router.post('/study-suggestion', async (req, res) => {
  const userId = req.user.id;
  const { available_minutes } = req.body;

  if (![15, 30, 45, 60].includes(available_minutes)) {
    return res.status(400).json({ success: false, error: 'available_minutes must be 15, 30, 45, or 60', data: null });
  }

  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'You have reached the daily limit of 5 AI suggestions. Try again tomorrow.',
      data: null,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'AI feature not configured', data: null });
  }

  try {
    // 1. Get LNA results
    const lnaResult = await pool.query(`
      SELECT topic_scores, weak_areas, overall_percentage
      FROM user_lna_results
      WHERE user_id = $1
      ORDER BY taken_at DESC LIMIT 1
    `, [userId]);

    const lnaData = lnaResult.rows[0] || null;

    // 2. Get quiz history from last 30 days
    const historyResult = await pool.query(`
      SELECT q.subject, q.topic, ua.is_correct, qs.completed_at::date AS quiz_date
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
        AND qs.completed_at >= NOW() - INTERVAL '30 days'
      ORDER BY qs.completed_at DESC
    `, [userId]);

    // 3. Subtopic performance summary
    const subtopicPerf = await pool.query(`
      SELECT q.topic, q.subject,
             COUNT(*)::int AS attempted,
             SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::int AS correct
      FROM user_answers ua
      JOIN quiz_sessions qs ON ua.session_id = qs.id
      JOIN questions q ON ua.question_id = q.id
      WHERE qs.user_id = $1
      GROUP BY q.topic, q.subject
      ORDER BY q.subject, q.topic
    `, [userId]);

    // 4. All available subtopics
    const allSubtopics = await pool.query(`
      SELECT DISTINCT topic, subject FROM questions ORDER BY subject, topic
    `);

    // Find unattempted subtopics
    const attemptedSet = new Set(subtopicPerf.rows.map(r => r.topic));
    const unattempted = allSubtopics.rows.filter(r => !attemptedSet.has(r.topic));

    // Build the data payload for Claude
    const topicScores = lnaData?.topic_scores || [];
    const recentHistory = historyResult.rows.slice(0, 200); // cap to keep token count manageable

    const subtopicSummary = subtopicPerf.rows.map(r => ({
      topic: r.topic,
      subject: r.subject,
      attempted: r.attempted,
      correct: r.correct,
      percentage: r.attempted > 0 ? Math.round((r.correct / r.attempted) * 100) : 0,
    }));

    // Build dates when each topic was last studied (for spaced repetition)
    const topicDates = {};
    for (const row of recentHistory) {
      if (!topicDates[row.topic]) topicDates[row.topic] = [];
      const dateStr = row.quiz_date?.toISOString?.() || row.quiz_date;
      if (!topicDates[row.topic].includes(dateStr)) {
        topicDates[row.topic].push(dateStr);
      }
    }

    const questionCountMap = { 15: 10, 30: 20, 45: 30, 60: 40 };
    const targetQuestions = questionCountMap[available_minutes];

    const userData = {
      lna_topic_scores: topicScores.map(t => ({
        topic: t.topic, subject: t.subject, level: t.level, percentage: t.percentage,
      })),
      subtopic_performance: subtopicSummary,
      unattempted_subtopics: unattempted.map(r => ({ topic: r.topic, subject: r.subject })),
      topic_last_studied_dates: topicDates,
      available_minutes,
      target_question_count: targetQuestions,
      today: new Date().toISOString().split('T')[0],
    };

    const systemPrompt = `You are a personalised MSRA revision advisor for a UK medical trainee. Your job is to recommend which subtopics the user should study in their next session.

Rules:
1. Apply the spaced repetition 2-3-5-7 principle: suggest re-reviewing subtopics that were last studied 2, 3, 5, or 7 days ago, alongside introducing new weak subtopics.
2. Prioritise RED LNA subtopics (weakest areas) and any subtopics with below 60% correct rate.
3. If the user has unattempted subtopics in weak subjects, include some of those.
4. Tailor to the available time: ${available_minutes} minutes ≈ ${targetQuestions} questions. Pick enough subtopics to cover that many questions (typically 3-6 subtopics).
5. Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Return this exact JSON structure:
{
  "summary": "Brief 2-sentence explanation of why these topics are suggested",
  "subtopics": ["Subtopic Name 1", "Subtopic Name 2"],
  "question_count": ${targetQuestions},
  "reasoning": ["One sentence for each subtopic explaining why it was chosen"]
}`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Here is my revision data:\n\n${JSON.stringify(userData, null, 2)}\n\nPlease generate my personalised study session recommendation.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Claude API error:', response.status, errBody);
      return res.status(502).json({ success: false, error: 'AI service temporarily unavailable', data: null });
    }

    const claudeResponse = await response.json();
    const textContent = claudeResponse.content?.[0]?.text || '';

    // Parse the JSON from Claude's response
    let suggestion;
    try {
      // Try to extract JSON from the response (Claude sometimes wraps in markdown)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      suggestion = JSON.parse(jsonMatch ? jsonMatch[0] : textContent);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', textContent);
      return res.status(502).json({ success: false, error: 'Failed to parse AI response', data: null });
    }

    return res.json({
      success: true,
      data: {
        summary: suggestion.summary || '',
        subtopics: suggestion.subtopics || [],
        question_count: suggestion.question_count || targetQuestions,
        reasoning: suggestion.reasoning || [],
      },
      error: null,
    });
  } catch (err) {
    console.error('AI study suggestion error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to generate study suggestion', data: null });
  }
});

module.exports = router;
