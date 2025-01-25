const { body, param, query } = require('express-validator');
const { RATING_PARAMETERS } = require('../../config/ratingConstants');

// Helper to check if rating parameter is valid
const isValidRatingParameter = (value) => {
  return (
    (value.startsWith('rp') && ['1', '2', '3', '4', '5'].includes(value.slice(2))) ||
    (value.startsWith('mp') && ['1', '2', '3'].includes(value.slice(2)))
  );
};

// Validation for getting user ratings
const getUserRatingsValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

// Validation for updating ratings
const updateRatingValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  body('parameter')
    .custom(isValidRatingParameter)
    .withMessage('Invalid rating parameter. Must be rp1-rp5 or mp1-mp3'),
  
  body('value')
    .isInt({ min: -50, max: 50 })
    .withMessage('Rating change must be between -50 and 50'),
  
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 200 })
    .withMessage('Reason must be between 10 and 200 characters'),
];

// Validation for getting rating history
const getRatingHistoryValidation = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

module.exports = {
  getUserRatingsValidation,
  updateRatingValidation,
  getRatingHistoryValidation
};