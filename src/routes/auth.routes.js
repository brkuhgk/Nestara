const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// POST /api/auth/register - New user registration
router.post('/register', [
 body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
 body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
 body('phone').matches(/^\+?[\d\s-]{10,}$/).withMessage('Please provide a valid phone number'),
 body('name').trim().notEmpty().withMessage('Name is required'),
 body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
 body('type').isIn(['tenant', 'maintainer','norole']).withMessage('Invalid user type')
], authController.register);

// POST /api/auth/verify-otp - Verify email/phone OTP
router.post('/verify-otp', [
 body('type').isIn(['email', 'phone']),
 body('otp').isLength({ min: 6, max: 6 })
], authController.verifyOTP);

// POST /api/auth/verify-email
router.post('/verify-email', [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('token')
      .notEmpty()
      .withMessage('Verification code is required')
  ], authController.verifyEmail);
  
 
// POST /api/auth/login - User login
router.post('/login', [
 body('email').isEmail().normalizeEmail(),
 body('password').notEmpty()
], authController.login);

// POST /api/auth/resend-otp - User login
router.post('/resend-otp', [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ], authController.resendOTP);
module.exports = router;