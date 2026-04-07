const { HttpError } = require('../utils/httpError');

const notFoundHandler = (req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Uploaded file exceeds the maximum allowed file size' });
  }

  const statusCode = err instanceof HttpError ? err.statusCode : 500;
  const payload = {
    message: err.message || 'Internal server error',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && !(err instanceof HttpError)) {
    payload.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(`[${req.requestId || 'unknown'}]`, err);
  }

  res.status(statusCode).json(payload);
};

module.exports = { notFoundHandler, errorHandler };
