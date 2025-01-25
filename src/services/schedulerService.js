// src/services/schedulerService.js
const RatingService = require('./ratingService');
const logger = require('../config/logger');
const { UPDATE_INTERVALS } = require('../config/constants');

class SchedulerService {
    constructor() {
        this.isRunning = false;
        this.scheduledTasks = new Map();
    }

    initialize() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        logger.info('Scheduler service initialized');

        // Schedule rating updates
        this.scheduleTask('ratingUpdates', 
            () => this.processRatingUpdates(),
            UPDATE_INTERVALS.DAILY_CHECK
        );
    }

    scheduleTask(taskName, taskFn, interval) {
        const task = async () => {
            try {
                await taskFn();
                logger.info(`Task ${taskName} completed successfully`);
            } catch (error) {
                logger.error(`Error in task ${taskName}:`, error);
            }
        };

        const intervalId = setInterval(task, interval);
        this.scheduledTasks.set(taskName, intervalId);

        // Run immediately on start
        task();
    }

    async processRatingUpdates() {
        try {
            const processedCount = await RatingService.processTopicRatings();
            logger.info(`Processed ratings for ${processedCount} topics`);
        } catch (error) {
            logger.error('Failed to process rating updates:', error);
        }
    }

    shutdown() {
        this.isRunning = false;
        for (const [taskName, intervalId] of this.scheduledTasks) {
            clearInterval(intervalId);
            logger.info(`Stopped task: ${taskName}`);
        }
        this.scheduledTasks.clear();
        logger.info('Scheduler service shut down');
    }
}

module.exports = new SchedulerService();