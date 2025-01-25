// src/controllers/topicController.js
const TopicService = require('../services/topicService');
const { successResponse } = require('../utils/response');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');

const topicController = {
  /**
   * Get all topics for a house with filters
   * GET /api/topics
   */
  async getHouseTopics(req, res) {
    try {
      
      const topics = await TopicService.getHouseTopics(req.params.houseId);
      // return successResponse(res, topics);
      res.status(200).json(topics);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Get a specific topic
   * GET /api/topics/:id
   */
  async getTopic(req, res) {
    try {
      const topic = await TopicService.getTopicById(req.params.id);
      if (!topic) {
        throw new AppError('Topic not found', StatusCodes.NOT_FOUND);
      }
      return successResponse(res, topic);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Create a new topic
   * POST /api/topics
   */
  async createTopic(req, res) {
    try {
      const topicData = {
        house_id: req.body.house_id,
        description: req.body.description,
        type: req.body.type,
        created_for: req.body.created_for,
        rating_parameter: req.body.rating_parameter,
        images: req.body.images
      };

      const topic = await TopicService.createTopic(topicData, req.user.id);
      return successResponse(res, topic, 'Topic created successfully', StatusCodes.CREATED);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Vote on a topic
   * POST /api/topics/:id/vote
   */
  async voteTopic(req, res) {
    try {
      const { voteType } = req.body;
      console.log('voteType:', voteType);
      if (!['upvote', 'downvote'].includes(voteType)) {
        throw new AppError('Invalid vote type', StatusCodes.BAD_REQUEST);
      }
      console.log('req.params.id:', req.params.id);
      console.log('req.user.id:', req.user.id);

      const updatedTopic = await TopicService.voteTopicByDbFunction(
        req.params.id,
        req.user.id,
        voteType
      );

      return successResponse(res, updatedTopic, 'Vote recorded successfully');
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Upload images for a topic
   * POST /api/topics/:id/images
   */
  async uploadImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        throw new AppError('No images uploaded', StatusCodes.BAD_REQUEST);
      }

      const imageUrls = req.files.map(file => file.location); // Assuming S3 upload
      const topic = await TopicService.addImages(req.params.id, imageUrls);

      return successResponse(res, topic, 'Images uploaded successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Archive a topic
   * PUT /api/topics/:id/archive
   */
  async archiveTopic(req, res, next) {
    try {
      const topic = await TopicService.archiveTopic(req.params.id);
      return successResponse(res, topic, 'Topic archived successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = topicController;