const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const houseRoutes = require('./house.routes');
const topicRoutes = require('./topic.routes');
const ratingRoutes = require('./rating.routes');
const timeBlockRoutes = require('./timeBlock.routes');
const imageRoutes = require('./image.routes');

router.use('/auth', authRoutes); // This maps to /api/auth
router.use('/users', userRoutes);
router.use('/houses', houseRoutes);
router.use('/topics', topicRoutes);
router.use('/ratings', ratingRoutes);
router.use('/time-blocks', timeBlockRoutes);
router.use('/images', imageRoutes);

module.exports = router;