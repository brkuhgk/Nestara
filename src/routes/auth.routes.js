const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// POST /api/auth/register - New user registration
router.post('/register', [
 body('email').isEmail(),
 body('phone').matches(/^\+?[\d\s-]{10,}$/),
 body('name').trim().notEmpty(),
 body('username').trim().isLength({ min: 3 })
], authController.register);

// POST /api/auth/verify-otp - Verify email/phone OTP
router.post('/verify-otp', [
 body('type').isIn(['email', 'phone']),
 body('otp').isLength({ min: 6, max: 6 })
], authController.verifyOTP);

// POST /api/auth/login - User login
router.post('/login', [
 body('username').trim().notEmpty(),
 body('password').exists()
], authController.login);

module.exports = router;