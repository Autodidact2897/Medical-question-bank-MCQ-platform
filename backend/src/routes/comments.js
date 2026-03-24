const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/questions/:id/comments — returns all comments for a question (public-ish, but we need auth for posting)
router.get('/:id/comments', async (req, res) => {
  const questionId = parseInt(req.params.id);
  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ success: false, error: 'Invalid question ID', data: null });
  }

  try {
    const result = await pool.query(`
      SELECT qc.id, qc.comment_text, qc.created_at,
             SPLIT_PART(u.email, '@', 1) AS username
      FROM question_comments qc
      JOIN users u ON qc.user_id = u.id
      WHERE qc.question_id = $1
      ORDER BY qc.created_at ASC
    `, [questionId]);

    return res.json({ success: true, data: { comments: result.rows }, error: null });
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch comments', data: null });
  }
});

// POST /api/questions/:id/comments — add a comment (protected)
router.post('/:id/comments', authMiddleware, async (req, res) => {
  const questionId = parseInt(req.params.id);
  const { comment_text } = req.body;

  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ success: false, error: 'Invalid question ID', data: null });
  }

  if (!comment_text || comment_text.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Comment text is required', data: null });
  }

  if (comment_text.length > 2000) {
    return res.status(400).json({ success: false, error: 'Comment must be under 2000 characters', data: null });
  }

  try {
    const result = await pool.query(`
      INSERT INTO question_comments (question_id, user_id, comment_text)
      VALUES ($1, $2, $3)
      RETURNING id, comment_text, created_at
    `, [questionId, req.user.id, comment_text.trim()]);

    const comment = result.rows[0];
    // Get the username for the response
    const userResult = await pool.query(
      "SELECT SPLIT_PART(email, '@', 1) AS username FROM users WHERE id = $1",
      [req.user.id]
    );
    comment.username = userResult.rows[0]?.username || 'Anonymous';

    return res.json({ success: true, data: { comment }, error: null });
  } catch (err) {
    console.error('Error posting comment:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to post comment', data: null });
  }
});

// POST /api/questions/:id/feedback — report an issue with a question (protected)
router.post('/:id/feedback', authMiddleware, async (req, res) => {
  const questionId = parseInt(req.params.id);
  const { feedback_type, feedback_text } = req.body;

  if (!questionId || isNaN(questionId)) {
    return res.status(400).json({ success: false, error: 'Invalid question ID', data: null });
  }

  const validTypes = ['wrong_answer', 'unclear_question', 'incorrect_explanation', 'other'];
  if (!feedback_type || !validTypes.includes(feedback_type)) {
    return res.status(400).json({ success: false, error: 'Invalid feedback type', data: null });
  }

  try {
    await pool.query(`
      INSERT INTO question_feedback (question_id, user_id, feedback_type, feedback_text)
      VALUES ($1, $2, $3, $4)
    `, [questionId, req.user.id, feedback_type, (feedback_text || '').trim() || null]);

    return res.json({ success: true, data: { message: 'Feedback submitted' }, error: null });
  } catch (err) {
    console.error('Error submitting feedback:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to submit feedback', data: null });
  }
});

module.exports = router;
