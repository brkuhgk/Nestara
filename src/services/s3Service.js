// src/services/s3Service.js
const { s3, BUCKET_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

class S3Service {
  /**
   * Generate a pre-signed URL for uploading a file to S3
   * @param {string} fileType - MIME type of the file
   * @param {string} folder - Folder path in S3 bucket
   * @returns {Promise<{uploadUrl: string, fileKey: string}>}
   */
  async getUploadUrl(fileType, folder = 'general') {
    try {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(fileType)) {
        throw new Error(`Invalid file type: ${fileType}. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}`);
      }

      // Generate a unique file key with extension based on MIME type
      const extension = fileType.split('/')[1];
      const fileKey = `${folder}/${uuidv4()}.${extension}`;

      // Generate pre-signed URL for upload
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        Expires: 300 // URL expires in 5 minutes
      };

      const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

      logger.info(`Generated upload URL for file key: ${fileKey}`);
      return {
        uploadUrl,
        fileKey
      };
    } catch (error) {
      logger.error('Error generating upload URL:', error);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for downloading/viewing a file from S3
   * @param {string} fileKey - S3 object key
   * @returns {Promise<string>} Pre-signed URL for downloading/viewing
   */
  async getDownloadUrl(fileKey) {
    try {
      // Ensure key has the proper folder prefix if not already included
      let fullKey = fileKey;
      if (!fileKey.startsWith('profile-images/') && !fileKey.includes('/')) {
        fullKey = `profile-images/${fileKey}`;
        logger.info(`Added folder prefix to key: ${fullKey}`);
      }

      const params = {
        Bucket: BUCKET_NAME,
        Key: fullKey,
        Expires: 3600 // URL expires in 1 hour
      };

      const downloadUrl = await s3.getSignedUrlPromise('getObject', params);
      logger.info(`Generated download URL for key: ${fullKey}`);
      return downloadUrl;
    } catch (error) {
      logger.error(`Error generating download URL for key ${fileKey}:`, error);
      throw error;
    }
  }

  /**
   * Check if an object exists in S3
   * @param {string} fileKey - S3 object key
   * @returns {Promise<boolean>} Whether the object exists
   */
  async objectExists(fileKey) {
    try {
      // Ensure key has the proper folder prefix if not already included
      let fullKey = fileKey;
      if (!fileKey.startsWith('profile-images/') && !fileKey.includes('/')) {
        fullKey = `profile-images/${fileKey}`;
        logger.info(`Added folder prefix to key for existence check: ${fullKey}`);
      }

      const params = {
        Bucket: BUCKET_NAME,
        Key: fullKey
      };

      try {
        await s3.headObject(params).promise();
        logger.info(`Object exists: ${fullKey}`);
        return true;
      } catch (error) {
        if (error.code === 'NotFound') {
          logger.warn(`Object does not exist: ${fullKey}`);
          return false;
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Error checking if object exists: ${fileKey}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param {string} fileKey - S3 object key
   * @returns {Promise<void>}
   */
  async deleteFile(fileKey) {
    try {
      // Ensure key has the proper folder prefix if not already included
      let fullKey = fileKey;
      if (!fileKey.startsWith('profile-images/') && !fileKey.includes('/')) {
        fullKey = `profile-images/${fileKey}`;
        logger.info(`Added folder prefix to key for deletion: ${fullKey}`);
      }

      // Check if file exists before attempting to delete
      const exists = await this.objectExists(fullKey);
      if (!exists) {
        logger.warn(`File with key ${fullKey} does not exist in S3. Skipping deletion.`);
        return;
      }

      const params = {
        Bucket: BUCKET_NAME,
        Key: fullKey
      };

      await s3.deleteObject(params).promise();
      logger.info(`Deleted file with key: ${fullKey} from S3`);
    } catch (error) {
      logger.error(`Error deleting file with key ${fileKey}:`, error);
      throw error;
    }
  }

  /**
   * Validate file metadata before upload
   * @param {number} fileSize - Size of the file in bytes
   * @param {string} fileType - MIME type of the file
   * @returns {boolean}
   */
  validateFile(fileSize, fileType) {
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      throw new Error(`Invalid file type: ${fileType}. Allowed types are: ${ALLOWED_FILE_TYPES.join(', ')}`);
    }

    return true;
  }
}

module.exports = new S3Service();