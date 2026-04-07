const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { auth, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const { logAuditEvent } = require('../services/auditLogService');
const { validateCreateUserPayload, withValidation } = require('../middleware/validation');
const { registerUser } = require('../services/authService');
const { createHttpError } = require('../utils/httpError');

const router = express.Router();

router.get(
  '/',
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json(users);
  })
);

router.post(
  '/',
  auth,
  adminOnly,
  withValidation(validateCreateUserPayload),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body, req.user);
    res.status(201).json(result.user);
  })
);

router.patch(
  '/:id/status',
  auth,
  adminOnly,
  asyncHandler(async (req, res) => {
    const user = await User.unscoped().findByPk(req.params.id);
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    user.isActive = Boolean(req.body.isActive);
    await user.save();
    await logAuditEvent({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: user.id,
      userId: req.user.id,
      ipAddress: req.ip,
    });
    res.json(user);
  })
);

module.exports = router;
