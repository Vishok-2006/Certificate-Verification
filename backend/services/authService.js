const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');
const { logAuditEvent } = require('./auditLogService');
const { createHttpError } = require('../utils/httpError');

const buildAuthPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  walletAddress: user.walletAddress,
  institutionName: user.institutionName,
  isActive: user.isActive,
});

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const registerUser = async (payload, actor) => {
  const existingUser = await User.unscoped().findOne({ where: { email: payload.email } });
  if (existingUser) {
    throw createHttpError(400, 'User already exists');
  }

  const requestedRole = payload.role || 'verifier';
  const role = actor?.role === 'admin' ? requestedRole : 'verifier';

  if (!actor && requestedRole === 'admin') {
    if (!env.adminRegistrationKey || payload.adminRegistrationKey !== env.adminRegistrationKey) {
      throw createHttpError(403, 'Admin registration is restricted');
    }
  }

  if (!actor && requestedRole === 'issuer') {
    throw createHttpError(403, 'Issuer accounts can only be created by an admin');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);
  const user = await User.unscoped().create({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role,
    institutionName: payload.institutionName || null,
    walletAddress: payload.walletAddress || null,
    isActive: true,
  });

  await logAuditEvent({
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: user.id,
    userId: actor?.id || user.id,
    metadata: { role },
  });

  return {
    token: signToken(user),
    user: buildAuthPayload(user),
  };
};

const loginUser = async ({ email, password }, requestContext = {}) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw createHttpError(400, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch || !user.isActive) {
    throw createHttpError(400, 'Invalid credentials');
  }

  await logAuditEvent({
    action: 'USER_LOGGED_IN',
    entityType: 'user',
    entityId: user.id,
    userId: user.id,
    ipAddress: requestContext.ipAddress,
  });

  return {
    token: signToken(user),
    user: buildAuthPayload(user),
  };
};

module.exports = {
  buildAuthPayload,
  loginUser,
  registerUser,
};
