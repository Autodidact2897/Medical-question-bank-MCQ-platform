const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup and /api/auth/register (alias)
async function handleSignup(req, res) {
  console.log('Signup request received');
  const { email, password } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please provide a valid email address', data: null });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters', data: null });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Signup failed - email already exists');
      return res.status(409).json({ success: false, error: 'An account with this email already exists', data: null });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, password_hash]
    );

    const user = result.rows[0];

    // Create JWT so user is logged in immediately after registration
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log('User created successfully');
    return res.status(201).json({ success: true, token, data: { id: user.id, email: user.email }, error: null });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error during signup', data: null });
  }
}
router.post('/signup', handleSignup);
router.post('/register', handleSignup);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('Login request received');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required', data: null });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('Login failed - email not found');
      return res.status(401).json({ success: false, error: 'Invalid email or password', data: null });
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('Login failed - wrong password');
      return res.status(401).json({ success: false, error: 'Invalid email or password', data: null });
    }

    // Create JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HttpOnly cookie — sameSite 'none' required for cross-origin (Vercel → Render)
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const is_admin = adminEmails.includes(user.email);
    console.log('Login successful');
    return res.json({ success: true, token, data: { id: user.id, email: user.email, is_admin }, error: null });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error during login', data: null });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  console.log('Logout request received');
  res.clearCookie('authToken', { httpOnly: true, secure: true, sameSite: 'none' });
  return res.json({ success: true, data: { message: 'Logged out' }, error: null });
});

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, async (req, res) => {
  console.log('Me request');
  try {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found', data: null });
    }
    const user = result.rows[0];
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const is_admin = adminEmails.includes(user.email);
    return res.json({ success: true, data: { id: user.id, email: user.email, created_at: user.created_at, is_admin }, error: null });
  } catch (err) {
    console.error('Me endpoint error:', err.message);
    return res.json({ success: true, data: { id: req.user.id, email: req.user.email }, error: null });
  }
});

// DELETE /api/auth/account (protected) — permanently delete user and all their data
router.delete('/account', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log('Account deletion requested');

  try {
    // Delete in order: user_answers → quiz_sessions → user_lna_results → user
    await pool.query(`
      DELETE FROM user_answers WHERE session_id IN (
        SELECT id FROM quiz_sessions WHERE user_id = $1
      )
    `, [userId]);

    await pool.query('DELETE FROM quiz_sessions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_lna_results WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    console.log('Account deleted');
    res.clearCookie('authToken', { httpOnly: true, secure: true, sameSite: 'none' });
    return res.json({ success: true, data: { message: 'Account deleted' }, error: null });
  } catch (err) {
    console.error('Account deletion error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to delete account', data: null });
  }
});

// DELETE /api/auth/reset-progress (protected) — reset all quiz history except LNA sessions
router.delete('/reset-progress', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  console.log('Progress reset requested');

  try {
    // Delete user_answers for non-LNA sessions, then delete those sessions
    // Also delete flagged_questions and question_comments for those sessions
    await pool.query(`
      DELETE FROM flagged_questions WHERE user_id = $1 AND session_id IN (
        SELECT id FROM quiz_sessions WHERE user_id = $1 AND COALESCE(is_lna_session, false) = false
      )
    `, [userId]);

    await pool.query(`
      DELETE FROM user_answers WHERE session_id IN (
        SELECT id FROM quiz_sessions WHERE user_id = $1 AND COALESCE(is_lna_session, false) = false
      )
    `, [userId]);

    await pool.query(`
      DELETE FROM quiz_sessions WHERE user_id = $1 AND COALESCE(is_lna_session, false) = false
    `, [userId]);

    console.log('Progress reset completed');
    return res.json({ success: true, data: { message: 'Progress reset' }, error: null });
  } catch (err) {
    console.error('Progress reset error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to reset progress', data: null });
  }
});

module.exports = router;
