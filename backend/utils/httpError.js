class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const createHttpError = (statusCode, message, details) => new HttpError(statusCode, message, details);

module.exports = { HttpError, createHttpError };
