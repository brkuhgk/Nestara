// src/services/topicRatingService.js
const supabase = require('../config/supabase');
const NotificationService = require('./notificationService');
const logger = require('../config/logger');
const { TOPIC_TYPES } = require('../config/constants');

class TopicRatingService {
    constructor() {
        // Rating points configuration
        this.RATING_POINTS = {
            CONFLICT_PENALTY: -50,
            MENTION_REWARD: 50
        };
    }

    /**
     * Process topics older than 30 days and update ratings accordingly
     */
    async processTopicRatings() {
        try {
            logger.info('Starting topic rating processing');
            
            // Calculate the cutoff date (30 days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);

            // Get all active topics older than 30 days
            const { data: oldTopics, error } = await supabase
                .from('topics')
                .select('*')
                .lt('created_at', cutoffDate)
                .eq('status', 'active');

            if (error) throw error;

            // Process each topic
            for (const topic of oldTopics) {
                await this.processSingleTopic(topic);
            }

            logger.info(`Processed ${oldTopics.length} topics`);
        } catch (error) {
            logger.error('Error processing topic ratings:', error);
            throw error;
        }
    }

    /**
     * Process a single topic and update ratings
     * @param {Object} topic - Topic to process
     */
    async processSingleTopic(topic) {
        try {
            switch (topic.type) {
                case TOPIC_TYPES.CONFLICT:
                    await this.handleConflictTopic(topic);
                    break;
                case TOPIC_TYPES.MENTIONS:
                    await this.handleMentionsTopic(topic);
                    break;
                case TOPIC_TYPES.GENERAL:
                    await this.handleGeneralTopic(topic);
                    break;
            }

            // Archive the topic
            await this.archiveTopic(topic.id);
        } catch (error) {
            logger.error(`Error processing topic ${topic.id}:`, error);
            throw error;
        }
    }

    /**
     * Handle conflict topic rating updates
     * @param {Object} topic - Conflict topic
     */
    async handleConflictTopic(topic) {
        if (!topic.created_for?.length) return;

        const updates = topic.created_for.map(userId => ({
            user_id: userId,
            rating_parameter: topic.rating_parameter,
            points: this.RATING_POINTS.CONFLICT_PENALTY,
            reason: `Conflict topic penalty: ${topic.description.substring(0, 50)}...`
        }));

        await this.processRatingUpdates(updates);
        
        // Send notifications to affected users
        for (const userId of topic.created_for) {
            await NotificationService.createNotification(userId, {
                type: 'rating_penalty',
                message: `Your rating was reduced due to an unresolved conflict`,
                metadata: {
                    topic_id: topic.id,
                    points: this.RATING_POINTS.CONFLICT_PENALTY,
                    parameter: topic.rating_parameter
                }
            });
        }
    }

    /**
     * Handle mentions topic rating updates
     * @param {Object} topic - Mentions topic
     */
    async handleMentionsTopic(topic) {
        if (!topic.created_for?.length) return;

        const updates = topic.created_for.map(userId => ({
            user_id: userId,
            rating_parameter: topic.rating_parameter,
            points: this.RATING_POINTS.MENTION_REWARD,
            reason: `Positive mention reward: ${topic.description.substring(0, 50)}...`
        }));

        await this.processRatingUpdates(updates);

        // Send notifications to affected users
        for (const userId of topic.created_for) {
            await NotificationService.createNotification(userId, {
                type: 'rating_reward',
                message: `Your rating was increased due to positive mentions`,
                metadata: {
                    topic_id: topic.id,
                    points: this.RATING_POINTS.MENTION_REWARD,
                    parameter: topic.rating_parameter
                }
            });
        }
    }

    /**
     * Handle general topic archival
     * @param {Object} topic - General topic
     */
    async handleGeneralTopic(topic) {
        // For general topics, we just need to archive them
        // No rating updates needed
        logger.info(`Archiving general topic ${topic.id}`);
    }

    /**
     * Process rating updates for users
     * @param {Array} updates - Array of rating updates
     */
    async processRatingUpdates(updates) {
        for (const update of updates) {
            const { data, error } = await supabase.rpc('update_user_rating', {
                p_user_id: update.user_id,
                p_parameter: update.rating_parameter,
                p_points: update.points,
                p_reason: update.reason
            });

            if (error) {
                logger.error(`Error updating rating for user ${update.user_id}:`, error);
                throw error;
            }
        }
    }

    /**
     * Archive a topic
     * @param {string} topicId - Topic ID to archive
     */
    async archiveTopic(topicId) {
        const { error } = await supabase
            .from('topics')
            .update({
                status: 'archived',
                archived_at: new Date().toISOString()
            })
            .eq('id', topicId);

        if (error) {
            logger.error(`Error archiving topic ${topicId}:`, error);
            throw error;
        }
    }

    /**
     * Initialize periodic processing
     * This should be called when the server starts
     */
    startPeriodicProcessing() {
        // Run every 24 hours
        setInterval(async () => {
            try {
                await this.processTopicRatings();
            } catch (error) {
                logger.error('Error in periodic topic rating processing:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Run immediately on start
        this.processTopicRatings().catch(error => {
            logger.error('Error in initial topic rating processing:', error);
        });
    }
}

module.exports = new TopicRatingService();