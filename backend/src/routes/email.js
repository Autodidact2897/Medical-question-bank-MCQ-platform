const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/email/status — check if current user is subscribed
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT subscribed FROM email_subscribers WHERE user_id = $1',
      [req.user.id]
    );
    const subscribed = result.rows.length > 0 ? result.rows[0].subscribed : false;
    return res.json({ success: true, data: { subscribed }, error: null });
  } catch (err) {
    console.error('Email status error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to check status', data: null });
  }
});

// POST /api/email/subscribe — toggle subscription on
router.post('/subscribe', async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO email_subscribers (user_id, email, subscribed, subscribed_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (user_id) DO UPDATE SET subscribed = true, subscribed_at = NOW(), unsubscribed_at = NULL
    `, [req.user.id, req.user.email]);

    console.log('User subscribed');
    return res.json({ success: true, data: { subscribed: true }, error: null });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to subscribe', data: null });
  }
});

// POST /api/email/unsubscribe — toggle subscription off
router.post('/unsubscribe', async (req, res) => {
  try {
    await pool.query(`
      UPDATE email_subscribers SET subscribed = false, unsubscribed_at = NOW()
      WHERE user_id = $1
    `, [req.user.id]);

    console.log('User unsubscribed');
    return res.json({ success: true, data: { subscribed: false }, error: null });
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to unsubscribe', data: null });
  }
});

module.exports = router;
