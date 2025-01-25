// src/scripts/ratingScheduler.js
const RatingService = require('../services/ratingService');
const logger = require('../config/logger');
const { UPDATE_INTERVALS } = require('../config/ratingConstants');

class RatingScheduler {
    constructor() {
        this.isRunning = false;
    }

    // Start the scheduler
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        logger.info('Rating scheduler started');

        // Run periodic updates
        this.schedulePeriodicUpdates();
    }

    // Stop the scheduler
    stop() {
        this.isRunning = false;
        logger.info('Rating scheduler stopped');
    }

    // Schedule periodic updates
    async schedulePeriodicUpdates() {
        while (this.isRunning) {
            try {
                // Process any pending updates
                await RatingService.processScheduledUpdates();
                
                // Wait for next check interval
                await new Promise(resolve => 
                    setTimeout(resolve, UPDATE_INTERVALS.DAILY_CHECK));
                
            } catch (error) {
                logger.error('Error in rating scheduler:', error);
                
                // Wait before retrying on error
                await new Promise(resolve => 
                    setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes
            }
        }
    }
}

// Create singleton instance
const scheduler = new RatingScheduler();

// Export the scheduler
module.exports = scheduler