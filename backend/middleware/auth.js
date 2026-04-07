const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(decoded.id, { attributes: ['id', 'name', 'email', 'role', 'walletAddress', 'institutionName', 'isActive'] });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is unavailable' });
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};

module.exports = {
  adminOnly: requireRole('admin'),
  auth,
  issuerOrAdmin: requireRole('issuer', 'admin'),
  requireRole,
};
