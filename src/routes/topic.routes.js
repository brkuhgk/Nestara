const express = require('express');
const router = express.Router();
const { body } = require('express-validator'); // Add this import
const auth = require('../middleware/auth/authenticate');
const topicController = require('../controllers/topicController');

// GET /api/topics - Get house topics
router.get('/', auth, topicController.getTopics);

// POST /api/topics - Create new topic
router.post('/', auth, [
  body('type').isIn(['general', 'conflict', 'mentions']),
  body('description').trim().notEmpty()
], topicController.createTopic);

// GET /api/topics/:id - Get topic details
router.get('/:id', auth, topicController.getTopic);

// POST /api/topics/:id/vote - Vote on topic
router.post('/:id/vote', auth, topicController.voteTopic);

module.exports = router;