const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { auth, adminOnly } = require('../middleware/auth');
const { loginUser, registerUser } = require('../services/authService');
const { buildRateLimiter } = require('../middleware/security');
const { validateLoginPayload, validateRegisterPayload, withValidation } = require('../middleware/validation');
const { env } = require('../config/env');

const router = express.Router();

const authRateLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: env.authRateLimitMax,
  keyPrefix: 'auth',
  keyGenerator: (req) => `${req.ip}:${req.path}`,
});

router.post(
  '/register',
  authRateLimiter,
  withValidation(validateRegisterPayload),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/login',
  authRateLimiter,
  withValidation(validateLoginPayload),
  asyncHandler(async (req, res) => {
    const result = await loginUser(req.body, { ipAddress: req.ip });
    res.json(result);
  })
);

router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

router.post(
  '/bootstrap-admin',
  authRateLimiter,
  withValidation(validateRegisterPayload),
  asyncHandler(async (req, res) => {
    req.body.role = 'admin';
    const result = await registerUser(req.body);
    res.status(201).json(result);
  })
);

router.post(
  '/invite-issuer',
  auth,
  adminOnly,
  withValidation(validateRegisterPayload),
  asyncHandler(async (req, res) => {
    req.body.role = 'issuer';
    const result = await registerUser(req.body, req.user);
    res.status(201).json(result);
  })
);

module.exports = router;
