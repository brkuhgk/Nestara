const { body } = require('express-validator');

exports.createHouseValidator = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('House name must be between 3 and 100 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object with latitude and longitude'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude')
];