const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth/authenticate');
const ratingController = require('../controllers/ratingController');
const { validate } = require('../middleware/validators/validator');
const { getUserRatingsValidation, updateRatingValidation, getRatingHistoryValidation } = require('../middleware/validators/ratingValidator');

// GET /api/ratings/:userId - Get user's ratings
router.get('/:userId', auth, getUserRatingsValidation, validate, ratingController.getUserRatings);

// GET /api/ratings/:userId/history - Get user's rating history
router.get('/:userId/history', auth, getRatingHistoryValidation, validate, ratingController.getRatingHistory);

// POST /api/ratings/:userId/update - Manual rating update (admin only)
router.post('/:userId/update', auth, updateRatingValidation, validate, ratingController.updateRating);

module.exports = router;