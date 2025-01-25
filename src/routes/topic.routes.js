const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const multer = require('multer');
const auth = require('../middleware/auth/authenticate');
const topicController = require('../controllers/topicController');
const { TOPIC_TYPES } = require('../config/constants');
const { validate } = require('../middleware/validators/validator');

// Configure multer for image uploads
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5 // Maximum 5 files per upload
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Validation middleware
const createTopicValidation = [
    body('house_id').isUUID().withMessage('Valid house ID is required'),
    body('description')
        .trim()
        .isLength({ min: 5, max: 1000 })
        .withMessage('Description must be between 5 and 1000 characters'),
    body('type')
        .isIn(Object.values(TOPIC_TYPES))
        .withMessage('Invalid topic type'),
    body('created_for')
        .optional()
        .isArray()
        .withMessage('created_for must be an array of user IDs'),
    body('created_for.*')
        .optional()
        .isUUID()
        .withMessage('Invalid user ID in created_for array'),
    body('rating_parameter')
        .if(body('type').not().equals(TOPIC_TYPES.GENERAL))
        .matches(/^(rp[1-5]|mp[1-3])$/)
        .withMessage('Invalid rating parameter')
];

const voteValidation = [
    body('voteType')
        .isIn(['upvote', 'downvote'])
        .withMessage('Vote type must be either upvote or downvote')
];

const getTopicsValidation = [
    query('houseId').isUUID().withMessage('Valid house ID is required'),
    query('type')
        .optional()
        .isIn(Object.values(TOPIC_TYPES))
        .withMessage('Invalid topic type'),
    query('status')
        .optional()
        .isIn(['active', 'archived'])
        .withMessage('Invalid status'),
    query('created_for')
        .optional()
        .isUUID()
        .withMessage('Invalid user ID')
];

// Routes

/**
 * @route GET /api/topics
 * @desc Get all topics for a house with filters
 * @access Private
 */
router.get('/', 
    auth, 
    getTopicsValidation,
    validate,
    topicController.getHouseTopics
);

/**
 * @route POST /api/topics
 * @desc Create a new topic
 * @access Private
 */
router.post('/',
    auth,
    createTopicValidation,
    validate,
    topicController.createTopic
);

/**
 * @route GET /api/topics/:id
 * @desc Get a specific topic
 * @access Private
 */
router.get('/:id',
    auth,
    param('id').isUUID().withMessage('Invalid topic ID'),
    validate,
    topicController.getTopic
);

/**
 * @route POST /api/topics/:id/vote
 * @desc Vote on a topic
 * @access Private
 */
router.post('/:id/vote',
    auth,
    param('id').isUUID().withMessage('Invalid topic ID'),
    voteValidation,
    validate,
    topicController.voteTopic
);

/**
 * @route POST /api/topics/:id/images
 * @desc Upload images for a topic
 * @access Private
 */
router.post('/:id/images',
    auth,
    param('id').isUUID().withMessage('Invalid topic ID'),
    upload.array('images', 5), // Allow up to 5 images
    validate,
    topicController.uploadImages
);

/**
 * @route PUT /api/topics/:id/archive
 * @desc Archive a topic
 * @access Private
 */
router.put('/:id/archive',
    auth,
    param('id').isUUID().withMessage('Invalid topic ID'),
    validate,
    topicController.archiveTopic
);

/**
 * @route GET /api/topics/house/:houseId/conflicts
 * @desc Get all conflict topics for a house
 * @access Private
 */
router.get('/house/:houseId/conflicts',
    auth,
    param('houseId').isUUID().withMessage('Invalid house ID'),
    validate,
    async (req, res, next) => {
        req.query = {
            ...req.query,
            houseId: req.params.houseId,
            type: TOPIC_TYPES.CONFLICT,
            status: 'active'
        };
        return topicController.getHouseTopics(req, res, next);
    }
);

// Error handling middleware for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer error handling
        return res.status(400).json({
            status: 'error',
            message: 'File upload error',
            error: err.message
        });
    }
    next(err);
});

module.exports = router;