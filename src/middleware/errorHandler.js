const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const { errorResponse } = require('../utils/response');
const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof AppError) {
    return errorResponse(res, err);
  }

  // Supabase specific errors
  if (err.statusCode === 400 || err.statusCode === 401) {
    return errorResponse(res, new AppError(err.message, err.statusCode));
  }

  // Default error
  const error = new AppError(
    'Something went wrong',
    StatusCodes.INTERNAL_SERVER_ERROR
  );

  return errorResponse(res, error);
};

module.exports = errorHandler;