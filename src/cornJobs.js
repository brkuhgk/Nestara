const cron = require('node-cron');
const topicRatingService = require('./services/topicRatingService');
const logger = require('../src/config/logger');

// Log to confirm cron job is scheduled
logger.info('Scheduling topic rating service cron job...');
// Schedule the topic rating service to run every hour
cron.schedule('0 * * * *', async () => { //runs every 24h 
  try {
    
    logger.info('Running topic rating service...');
    await topicRatingService.processTopicRatings();
    logger.info('Topic rating service completed successfully.');
  } catch (error) {
    logger.error('Error running topic rating service:', error);
  }
});

// '*/1 * * * *' - 1 min
// '*/5 * * * *' - 5 min
// '0 0 * * *' - everyday midnight
//Current Schedule
// The current schedule '0 * * * *' means:

// 0: At minute 0
// *: Every hour
// *: Every day of the month
// *: Every month
// *: Every day of the week
