
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { StatusCodes } = require('http-status-codes');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const routes = require('./routes');

const app = express();

const cronJobs = require('./cornJobs')
// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// General Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health Check
app.get('/health', (req, res) => {
  res.status(StatusCodes.OK).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Add this to server.js BEFORE your routes are mounted
app.get('/s3-test', async (req, res) => {
  const AWS = require('aws-sdk');
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION
  });
  
  const bucketName = process.env.AWS_S3_BUCKET;
  console.log('Testing S3 connection to bucket:', bucketName);
  
  try {
    // List first 5 objects
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      MaxKeys: 5
    }).promise();
    
    res.json({
      bucket: bucketName,
      fileCount: data.Contents.length,
      files: data.Contents.map(item => item.Key)
    });
  } catch (error) {
    console.error('S3 error:', error);
    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
});

app.get('/test-specific-file', async (req, res) => {
  try {
    const AWS = require('aws-sdk');
    const s3Client = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });
    
    const bucketName = process.env.AWS_S3_BUCKET;
    
    // Try different key formats to see which one works
    const testKey = '54dbe85b-f975-4df3-b6c1-6f6e3119bf73.jpeg';
    
    const keyVariations = [
      testKey,
      `profile-images/${testKey}`,
      `/profile-images/${testKey}`
    ];
    
    const results = {};
    
    for (const key of keyVariations) {
      try {
        // Check if file exists
        console.log(`Testing key: ${key}`);
        try {
          await s3Client.headObject({
            Bucket: bucketName,
            Key: key
          }).promise();
          results[key] = 'EXISTS';
          
          // Generate URL
          const url = s3Client.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: key,
            Expires: 3600
          });
          results[`${key}_url`] = url;
        } catch (err) {
          results[key] = `ERROR: ${err.code}`;
        }
      } catch (error) {
        results[key] = `TEST ERROR: ${error.message}`;
      }
    }
    
    res.json({
      status: 'success',
      bucket: bucketName,
      region: process.env.AWS_REGION,
      results
    });
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});


// API Routes
app.use('/api', routes); //TODO: change to /api/v1/  

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});


// 404 Handler
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error Handler
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  cronJobs; //Ensure the cron jobs started.
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  
  server.close(() => {
    process.exit(1);
  });
});

app.get('/list-bucket', async (req, res) => {
  try {
    console.log('Attempting to list bucket contents');
    console.log('Bucket name:', process.env.AWS_S3_BUCKET);
    console.log('AWS Region:', process.env.AWS_REGION);
    
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      region: process.env.AWS_REGION
    });
    
    // List objects in the bucket
    const result = await s3.listObjectsV2({
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: 10 // Limit to 10 items
    }).promise();
    
    res.json({
      status: 'success',
      bucketName: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      objectCount: result.Contents?.length || 0,
      objects: result.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      })) || []
    });
  } catch (error) {
    console.error('Bucket list error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      code: error.code
    });
  }
});




module.exports = server;