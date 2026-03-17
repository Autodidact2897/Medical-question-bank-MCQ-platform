const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  let token = null;

  // Check Authorization header first
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    console.log('Token found in Authorization header');
  }

  // Fall back to cookie
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    console.log('Token found in cookie');
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ success: false, error: 'Not authenticated', data: null });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    console.log('Token valid for user:', req.user.email);
    next();
  } catch (err) {
    console.log('Token invalid:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token has expired, please log in again', data: null });
    }
    return res.status(401).json({ success: false, error: 'Invalid token', data: null });
  }
}

module.exports = authMiddleware;
