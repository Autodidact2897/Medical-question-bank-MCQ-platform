const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body.email);
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
      console.log('Signup failed - email already exists:', email);
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
    console.log('User created successfully:', user.email);
    return res.status(201).json({ success: true, data: { id: user.id, email: user.email }, error: null });
  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error during signup', data: null });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body.email);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required', data: null });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('Login failed - email not found:', email);
      return res.status(401).json({ success: false, error: 'Invalid email or password', data: null });
    }

    const user = result.rows[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('Login failed - wrong password for:', email);
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

    console.log('Login successful:', user.email);
    return res.json({ success: true, data: { id: user.id, email: user.email, token }, error: null });
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
router.get('/me', authMiddleware, (req, res) => {
  console.log('Me request for user:', req.user.email);
  return res.json({ success: true, data: { id: req.user.id, email: req.user.email }, error: null });
});

module.exports = router;
