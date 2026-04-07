const crypto = require('crypto');

const requestId = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms ${req.ip}`
    );
  });

  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: http:;");
  next();
};

const rateLimitBuckets = new Map();

const buildRateLimiter = ({ windowMs, maxRequests, keyPrefix, keyGenerator }) => {
  return (req, res, next) => {
    const now = Date.now();
    const identifier = keyGenerator ? keyGenerator(req) : req.ip;
    const bucketKey = `${keyPrefix}:${identifier}`;
    const currentBucket = rateLimitBuckets.get(bucketKey);

    if (!currentBucket || now > currentBucket.resetAt) {
      rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (currentBucket.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((currentBucket.resetAt - now) / 1000));
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    currentBucket.count += 1;
    next();
  };
};

module.exports = {
  buildRateLimiter,
  requestId,
  requestLogger,
  securityHeaders,
};
