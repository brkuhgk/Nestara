// src/services/ratingService.js
const supabase = require('../config/supabase');
const logger = require('../config/logger');
const { TOPIC_TYPES } = require('../config/constants');


class RatingService {
    constructor() {
        this.BATCH_SIZE = 100; // Process topics in batches of 100
        this.RATING_POINTS = {
            CONFLICT: -50,
            MENTIONS: 10
        };
    }

    /**
     * Process topics and update ratings
     * This is the main method that will be called by the scheduler
     */
    async processTopicRatings() {
        try {
            logger.info('Starting topic rating processing');
            
            // Get cutoff date (30 days ago)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);

            // Process topics in batches
            let processedCount = 0;
            let hasMore = true;
            let lastId = null;

            while (hasMore) {
                const { topics, lastProcessedId } = await this.getTopicBatch(cutoffDate, lastId);
                
                if (topics.length === 0) {
                    hasMore = false;
                    break;
                }

                // Process this batch
                await this.processBatch(topics);
                
                processedCount += topics.length;
                lastId = lastProcessedId;
                
                logger.info(`Processed ${processedCount} topics so far`);
            }

            logger.info(`Completed processing ${processedCount} topics`);
            return processedCount;
        } catch (error) {
            logger.error('Error in processTopicRatings:', error);
            throw error;
        }
    }

    /**
     * Get a batch of topics to process
     */
    async getTopicBatch(cutoffDate, lastId = null) {
        let query = supabase
            .from('topics')
            .select('*')
            .lt('created_at', cutoffDate)
            .eq('status', 'active')
            .order('id')
            .limit(this.BATCH_SIZE);

        if (lastId) {
            query = query.gt('id', lastId);
        }

        const { data: topics, error } = await query;

        if (error) throw error;

        return {
            topics,
            lastProcessedId: topics.length > 0 ? topics[topics.length - 1].id : null
        };
    }

    /**
     * Process a batch of topics
     */
    async processBatch(topics) {
        for (const topic of topics) {
            await this.processSingleTopic(topic);
        }
    }

    /**
     * Process a single topic
     */
    async processSingleTopic(topic) {
        try {
            // Skip if no users to update
            if (!topic.created_for || topic.created_for.length === 0) {
                await this.archiveTopic(topic.id);
                return;
            }

            // Determine points based on topic type
            const points = topic.type === TOPIC_TYPES.CONFLICT 
                ? this.RATING_POINTS.CONFLICT 
                : topic.type === TOPIC_TYPES.MENTIONS 
                    ? this.RATING_POINTS.MENTIONS 
                    : null;

            // Process rating updates if points should be applied
            if (points !== null) {
                await this.updateUserRatings(topic, points);
            }

            // Archive the topic
            await this.archiveTopic(topic.id);

        } catch (error) {
            logger.error(`Error processing topic ${topic.id}:`, error);
            // Continue with other topics even if one fails
        }
    }

    /**
     * Update ratings for all users mentioned in a topic
     */
    async updateUserRatings(topic, points) {
        const updates = topic.created_for.map(userId => ({
            user_id: userId,
            rating_change: points,
            topic_id: topic.id,
            parameter: topic.rating_parameter,
            reason: points < 0 ? 'Conflict topic penalty' : 'Mentions topic reward'
        }));

        // Process updates in parallel with error handling for each
        await Promise.all(updates.map(update => 
            this.updateSingleUserRating(update).catch(error => {
                logger.error(`Error updating rating for user ${update.user_id}:`, error);
            })
        ));
    }

    /**
     * Update rating for a single user
     */
    async updateSingleUserRating({ user_id, rating_change, topic_id, parameter, reason }) {
        // Get current rating
        const { data: currentRating } = await supabase
            .from('user_ratings')
            .select(parameter)
            .eq('user_id', user_id)
            .single();

        if (!currentRating) return;

        // Calculate new rating value
        const currentValue = currentRating[parameter] || 0;
        const newValue = Math.max(0, Math.min(1000, currentValue + rating_change));

        // Update rating
        await supabase
            .from('user_ratings')
            .update({ 
                [parameter]: newValue,
                updated_at: new Date()
            })
            .eq('user_id', user_id);

        // Record history
        await supabase
            .from('rating_history')
            .insert({
                user_id,
                parameter,
                old_value: currentValue,
                new_value: newValue,
                change_amount: rating_change,
                reason,
                topic_id
            });
    }

    /**
     * Archive a topic
     */
    async archiveTopic(topicId) {
        await supabase
            .from('topics')
            .update({
                status: 'archived',
                archived_at: new Date()
            })
            .eq('id', topicId);
    }
}

module.exports = new RatingService();