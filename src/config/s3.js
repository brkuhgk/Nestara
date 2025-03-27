// src/config/s3.js
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS S3 Configuration
const s3Config = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
};

// Initialize S3 instance
const s3 = new AWS.S3(s3Config);

// Bucket name
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif'
];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

module.exports = {
  s3,
  BUCKET_NAME,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
};