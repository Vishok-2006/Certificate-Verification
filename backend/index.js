const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');
const { env, ensureEnv } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { buildRateLimiter, requestId, requestLogger, securityHeaders } = require('./middleware/security');

const app = express();

require('./models/User');
require('./models/Certificate');
require('./models/AuditLog');

app.use(requestId);
app.use(requestLogger);
app.use(securityHeaders);
app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(
  buildRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: env.apiRateLimitMax,
    keyPrefix: 'api',
  })
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', async (req, res, next) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', environment: env.nodeEnv });
  } catch (error) {
    next(error);
  }
});

app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'openapi.json'));
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/users', require('./routes/users'));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    ensureEnv(['jwtSecret']);
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
}

start();
