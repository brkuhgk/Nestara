// src/controllers/topicController.js
const TopicService = require('../services/topicService');
const { successResponse } = require('../utils/response');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const s3Service = require('../services/s3Service');


const topicController = {
  /**
   * Get all topics for a house with filters
   * GET /api/topics
   */
  async getHouseTopics(req, res) {
    try {
      
      const topics = await TopicService.getHouseTopics(
        req.params.houseId,
        req.user.id
      );
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
      // const topicData = {
      //   house_id: req.body.house_id,
      //   description: req.body.description,
      //   type: req.body.type,
      //   created_for: req.body.created_for,
      //   rating_parameter: req.body.rating_parameter,
      //   image: req.body.image,
      // };
      const { house_id, description, type, created_for, rating_parameter, image_keys } = req.body;


      // Generate view URLs for any uploaded images
      let images = [];
      if (image_keys && image_keys.length > 0) {
        images = await Promise.all(
          image_keys.map(key => s3Service.getDownloadUrl(key))
        );
      }

      console.log('images_keys', image_keys); 
      const topicData = {
        house_id,
        description,
        type,
        created_for,
        rating_parameter,
        image_keys,
        images
      };

      const topic = await TopicService.createTopic(topicData, req.user.id);
      return successResponse(res, topic, 'Topic created successfully', StatusCodes.CREATED);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  async updateTopicImages(req, res) {
    try {
      const { topicId } = req.params;
      const { image_keys } = req.body;

      // Delete old images if they exist
      const topic = await TopicService.getTopicById(topicId);
      if (topic.image_keys) {
        await Promise.all(
          topic.image_keys.map(key => s3Service.deleteFile(key))
        );
      }

      // Generate view URLs for new images
      const images = await Promise.all(
        image_keys.map(key => s3Service.getDownloadUrl(key))
      );

      const updatedTopic = await TopicService.updateTopic(topicId, {
        image_keys,
        images
      });

      return successResponse(res, updatedTopic);
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
            const { id: topicId } = req.params;
            const { voteType } = req.body;
            const userId = req.user.id;

            console.log('[TopicController] Processing vote:', {
                topicId,
                userId,
                voteType
            });

            const updatedTopic = await TopicService.voteTopicByDbFunction(
                topicId,
                userId,
                voteType
            );

            return successResponse(res, updatedTopic, 'Vote recorded successfully');
        } catch (error) {
            console.error('[TopicController] Vote error:', error);
            res.status(error.statusCode || StatusCodes.BAD_REQUEST)
                .json({ error: error.message });
        }
    },
  
    /**
     * Get vote status for a topic
     * GET /api/topics/:id/vote-status
     */
    async getVoteStatus(req, res) {
      try {
          const { id: topicId } = req.params;
          const userId = req.user.id;

          console.log('[TopicController] Getting vote status:', {
              topicId,
              userId
          });

          const voteStatus = await TopicService.getVoteStatus(topicId, userId);
          return successResponse(res, voteStatus);
      } catch (error) {
          console.error('[TopicController] Vote status error:', error);
          res.status(error.statusCode || StatusCodes.BAD_REQUEST)
              .json({ error: error.message });
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