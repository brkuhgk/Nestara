const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const houseRoutes = require('./house.routes');
const topicRoutes = require('./topic.routes');

router.use('/auth', authRoutes); // This maps to /api/auth
router.use('/users', userRoutes);
router.use('/houses', houseRoutes);
router.use('/topics', topicRoutes);

module.exports = router;