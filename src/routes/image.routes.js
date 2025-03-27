// src/routes/image.routes.js
const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const auth = require('../middleware/auth/authenticate');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validators/validator');

// Validation middleware
const uploadUrlValidation = [
  body('fileType')
    .notEmpty()
    .withMessage('File type is required')
    .matches(/^image\/(jpeg|png|gif)$/)
    .withMessage('Invalid file type. Allowed: image/jpeg, image/png, image/gif'),
  body('folder')
    .optional()
    .isString()
    .withMessage('Folder must be a string')
];

const fileKeyValidation = [
  param('fileKey')
    .notEmpty()
    .withMessage('File key is required')
];

const batchUrlsValidation = [
  body('fileKeys')
    .isArray()
    .withMessage('File keys must be an array')
    .notEmpty()
    .withMessage('File keys array cannot be empty')
];

// Get pre-signed URL for upload
router.post('/upload-url', auth, uploadUrlValidation, validate, imageController.getUploadUrl);

// Get pre-signed URL for viewing image
router.get('/:fileKey', auth, fileKeyValidation, validate, imageController.getImageUrl);

// Delete image
router.delete('/:fileKey', auth, fileKeyValidation, validate, imageController.deleteImage);

// Get multiple image URLs
router.post('/batch', auth, batchUrlsValidation, validate, imageController.getBatchImageUrls);

// List bucket contents for debugging
router.get('/list-bucket', auth, imageController.listBucketContents);

// Check if image exists
router.get('/check/:fileKey', auth, fileKeyValidation, validate, imageController.checkImageExists);




module.exports = router;