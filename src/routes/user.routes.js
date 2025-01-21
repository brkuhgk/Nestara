const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth/authenticate');
const userController = require('../controllers/userController');

// GET /api/users/profile - Get own profile
router.get('/profile', auth, userController.getProfile);

// GET /api/users/:id/ratings - Get user ratings
router.get('/:id/ratings', auth, userController.getUserRatings);

// PUT /api/users/profile - Update own profile
router.put('/profile', auth, userController.updateProfile);

module.exports = router;