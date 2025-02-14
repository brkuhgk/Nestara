// src/routes/timeBlock.routes.js
const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const auth = require('../middleware/auth/authenticate');
const timeBlockController = require('../controllers/timeBlockController');
const { validate } = require('../middleware/validators/validator');

// Validation middleware
const timeBlockValidation = [
  body('house_id').isUUID().withMessage('Valid house ID is required'),
  body('location')
    .isIn(['Kitchen', 'Washroom', 'Hall'])
    .withMessage('Invalid location'),
  body('date')
    .isDate()
    .withMessage('Valid date is required'),
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time is required (HH:mm)'),
  body('end_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time is required (HH:mm)')
];

const getTimeBlocksValidation = [
  query('house_id').isUUID().withMessage('Valid house ID is required'),
  query('date').isDate().withMessage('Valid date is required')
];

const userTimeBlocksValidation = [
  query('start_date').isDate().withMessage('Valid start date is required'),
  query('end_date').isDate().withMessage('Valid end date is required')
];

// Routes
router.post('/', [
  auth,
  timeBlockValidation,
  validate,
  timeBlockController.createTimeBlock
]);

router.get('/', [
  auth,
  getTimeBlocksValidation,
  validate,
  timeBlockController.getTimeBlocks
]);

router.delete('/:id', [
  auth,
  param('id').isUUID().withMessage('Valid time block ID is required'),
  validate,
  timeBlockController.deleteTimeBlock
]);

router.get('/user', [
  auth,
  userTimeBlocksValidation,
  validate,
  timeBlockController.getUserTimeBlocks
]);

module.exports = router;