const { StatusCodes } = require('http-status-codes');

exports.successResponse = (res, data, message = 'Success', statusCode = StatusCodes.OK) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

exports.errorResponse = (res, error) => {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || 'Internal server error';
  const errors = error.errors || [];

  return res.status(statusCode).json({
    status: 'error',
    message,
    errors
  });
};
