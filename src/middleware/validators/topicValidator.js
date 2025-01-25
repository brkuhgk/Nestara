const { body } = require('express-validator');
const { TOPIC_TYPES } = require('../../config/constants');

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

module.exports = {
    createTopicValidation
};