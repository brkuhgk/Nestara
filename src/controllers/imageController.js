// src/controllers/imageController.js
const { StatusCodes } = require('http-status-codes');
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');
const { ALLOWED_FILE_TYPES } = require('../config/s3');
const AppError = require('../utils/AppError');

const imageController = {
  /**
   * Get pre-signed URL for image upload
   * @route POST /api/images/upload-url
   */
  async getUploadUrl(req, res) {
    try {
      const { fileType, folder = 'general' } = req.body;
      console.log("========",fileType)
      if (!fileType) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: 'File type is required'
        });
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
        });
      }

      // Get pre-signed URL
      const { uploadUrl, fileKey } = await s3Service.getUploadUrl(fileType, folder);
      console.log(uploadUrl, fileKey)
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          uploadUrl,
          fileKey,
          expiresIn: 300 // 5 minutes
        }
      });
    } catch (error) {
      logger.error('Error getting upload URL:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Get pre-signed URL for viewing image
   * @route GET /api/images/:fileKey
   */
  // async getImageUrl(req, res) {
  //   try {
  //     const { fileKey } = req.params;

  //     if (!fileKey) {
  //       return res.status(StatusCodes.BAD_REQUEST).json({
  //         status: 'error',
  //         error: 'File key is required'
  //       });
  //     }
  //     console.log("fileKey",fileKey)
  //     // Check if file exists
  //     const exists = await s3Service.objectExists(fileKey);
  //     if (!exists) {
  //       return res.status(StatusCodes.NOT_FOUND).json({
  //         status: 'error',
  //         error: 'Image not found fuck'
  //       });
  //     }

  //     const downloadUrl = await s3Service.getDownloadUrl(fileKey);

  //     res.status(StatusCodes.OK).json({
  //       status: 'success',
  //       data: {
  //         url: downloadUrl,
  //         expiresIn: 3600 // 1 hour
  //       }
  //     });
  //   } catch (error) {
  //     logger.error('Error getting image URL:', error);
  //     res.status(StatusCodes.BAD_REQUEST).json({
  //       status: 'error',
  //       error: error.message
  //     });
  //   }
  // },

  async getImageUrl(req, res) {
    try {
      const { fileKey } = req.params;
  
      if (!fileKey) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: 'File key is required'
        });
      }
      
      // Prepare file key - store the original and possible prefixed version
      let keyToUse = fileKey;
      
      // Check if file exists - first try as is
      let exists = await s3Service.objectExists(keyToUse);
      
      // Try with profile-images prefix if it doesn't have one and doesn't exist
      if (!exists && !keyToUse.includes('/')) {
        const prefixedKey = `profile-images/${keyToUse}`;
        exists = await s3Service.objectExists(prefixedKey);
        if (exists) {
          keyToUse = prefixedKey;
        }
      }
      
      if (!exists) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: 'error',
          error: 'Image not found'
        });
      }
  
      // Get the download URL using the key that worked
      const downloadUrl = await s3Service.getDownloadUrl(keyToUse);
  
      res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          url: downloadUrl,
          expiresIn: 3600 // 1 hour
        }
      });
    } catch (error) {
      logger.error('Error getting image URL:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Delete image from S3
   * @route DELETE /api/images/:fileKey
   */
  async deleteImage(req, res) {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: 'File key is required'
        });
      }

      await s3Service.deleteFile(fileKey);

      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      logger.error('Error deleting image:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Get multiple images URLs
   * @route POST /api/images/batch
   */
  async getBatchImageUrls(req, res) {
    try {
      const { fileKeys } = req.body;
      
      if (!fileKeys || !Array.isArray(fileKeys) || fileKeys.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: 'File keys array is required'
        });
      }

      // Get URLs for all images in parallel
      const imageUrls = await Promise.all(
        fileKeys.map(async (fileKey) => {
          try {
            const url = await s3Service.getDownloadUrl(fileKey);
            return { fileKey, url };
          } catch (error) {
            logger.warn(`Error getting URL for key ${fileKey}:`, error);
            return { fileKey, error: error.message };
          }
        })
      );

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          images: imageUrls,
          expiresIn: 3600 // 1 hour
        }
      });
    } catch (error) {
      logger.error('Error getting batch image URLs:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        error: error.message
      });
    }
  },

  /**
   * Check if image exists in S3
   * @route GET /api/images/check/:fileKey
   */
  async checkImageExists(req, res) {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          error: 'File key is required'
        });
      }

      const exists = await s3Service.objectExists(fileKey);

      res.status(StatusCodes.OK).json({
        status: 'success',
        data: {
          exists
        }
      });
    } catch (error) {
      logger.error('Error checking image existence:', error);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        error: error.message
      });
    }
  },


  async listBucketContents(req, res) {
    try {
      console.log('Listing bucket contents');
      
      // Get the AWS SDK and create a new S3 instance directly
      const AWS = require('aws-sdk');
      const s3Client = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION
      });
      
      const BUCKET = process.env.AWS_S3_BUCKET;
      console.log('Bucket:', BUCKET);
      
      const result = await s3Client.listObjectsV2({
        Bucket: BUCKET,
        MaxKeys: 100
      }).promise();
      
      const files = result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));
      
      res.status(200).json({
        status: 'success',
        bucketName: BUCKET,
        count: files.length,
        files: files
      });
    } catch (error) {
      console.error('Error listing bucket:', error);
      res.status(500).json({
        status: 'error',
        error: error.message,
        code: error.code
      });
    }
  }
};



module.exports = imageController;