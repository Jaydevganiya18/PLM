// =============================================================================
// backend-node/middleware/auth.js
// JWT protect + role guard
// =============================================================================
const jwt      = require('jsonwebtoken');
const { User } = require('../db');

const SECRET = process.env.JWT_SECRET || 'plm_logixwaveai_secret';

// Verify JWT → attach req.user
exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token   = auth.split(' ')[1];
    const decoded = jwt.verify(token, SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role guard — usage: requireRole('Approver', 'Admin')
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error: `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user?.role}`,
    });
  }
  next();
};