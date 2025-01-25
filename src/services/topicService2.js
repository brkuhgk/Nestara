// src/services/topicService.js
const supabase = require('../config/supabase');
const RatingService = require('./ratingService');
const NotificationService = require('./notificationService');
const { TOPIC_TYPES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger');

class TopicService {
    /**
     * Create a new topic with validation and automatic rating updates
     * @param {Object} topicData - Topic creation data
     * @param {UUID} createdBy - User creating the topic
     * @returns {Promise<Object>} Created topic
     */
    async createTopic(topicData, createdBy) {
        const { house_id, description, type, created_for, rating_parameter, images } = topicData;

        try {
            // Validate if creator belongs to the house
            const { data: membership } = await supabase
                .from('house_members')
                .select('status')
                .eq('house_id', house_id)
                .eq('user_id', createdBy)
                .single();

                
            if (!membership || membership.status !== 'active') {
                throw new AppError('User not authorized to create topics in this house', StatusCodes.FORBIDDEN);
            }

            // For conflict/mentions topics, validate mentioned users belong to house
            if ((type === TOPIC_TYPES.CONFLICT || type === TOPIC_TYPES.MENTIONS) && created_for?.length) {
                const { data: mentionedMembers } = await supabase
                    .from('house_members')
                    .select('user_id')
                    .eq('house_id', house_id)
                    .eq('status', 'active')
                    .in('user_id', created_for);

                if (mentionedMembers.length !== created_for.length) {
                    throw new AppError('Some mentioned users are not active house members', StatusCodes.BAD_REQUEST);
                }
            }

            // Create the topic
            const { data: topic, error } = await supabase.rpc('create_topic_with_notification', {
                p_house_id: house_id,
                p_created_by: createdBy,
                p_created_for: created_for || [],
                p_type: type,
                p_description: description,
                p_rating_parameter: rating_parameter,
                p_images: images || []
            });

            if (error) throw error;

            // Handle automatic rating updates based on topic type
            if (type !== TOPIC_TYPES.GENERAL) {
                await this.setupRatingUpdates(topic);
            }

            return topic;
        } catch (error) {
            logger.error('Error creating topic:', error);
            throw new AppError(error.message, error.statusCode || StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Setup rating updates for conflict/mentions topics
     * @param {Object} topic - Topic object
     */
    async setupRatingUpdates(topic) {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const ratingChange = topic.type === TOPIC_TYPES.CONFLICT ? -50 : 50;
        
        for (const userId of topic.created_for) {
            await RatingService.scheduleRatingUpdate({
                user_id: userId,
                topic_id: topic.id,
                parameter: topic.rating_parameter,
                change: ratingChange,
                scheduled_for: thirtyDaysLater
            });
        }
    }

    /**
     * Get topics that need rating updates
     * @param {Date} cutoffDate - Date to check from
     * @returns {Promise<Array>} Topics needing updates
     */
    async getPendingRatingUpdateTopics(cutoffDate) {
        const { data, error } = await supabase
            .from('topics')
            .select('*')
            .lt('created_at', cutoffDate)
            .in('type', [TOPIC_TYPES.CONFLICT, TOPIC_TYPES.MENTIONS])
            .eq('rating_updated', false);

        if (error) throw error;
        return data;
    }

    /**
     * Vote on a topic with validation
     * @param {UUID} topicId - Topic ID
     * @param {UUID} userId - Voting user ID
     * @param {string} voteType - Type of vote
     */
    async voteTopic(topicId, userId, voteType) {
        try {
            // Validate topic exists and is active
            const { data: topic } = await supabase
                .from('topics')
                .select('*')
                .eq('id', topicId)
                .eq('status', 'active')
                .single();

            if (!topic) {
                throw new AppError('Topic not found or inactive', StatusCodes.NOT_FOUND);
            }

            // Check if user is part of the house
            const { data: membership } = await supabase
                .from('house_members')
                .select('status')
                .eq('house_id', topic.house_id)
                .eq('user_id', userId)
                .single();

            if (!membership || membership.status !== 'active') {
                throw new AppError('Not authorized to vote on this topic', StatusCodes.FORBIDDEN);
            }

            // Process vote using database function for atomicity
            const { data: updatedTopic, error } = await supabase.rpc('process_topic_vote', {
                p_topic_id: topicId,
                p_user_id: userId,
                p_vote_type: voteType
            });

            if (error) throw error;

            // Notify topic creator of significant vote changes
            if (updatedTopic.votes % 5 === 0) { // Every 5 votes
                await NotificationService.createNotification(topic.created_by, 'topic_votes', {
                    topic_id: topicId,
                    vote_count: updatedTopic.votes
                });
            }

            return updatedTopic;
        } catch (error) {
            logger.error('Error processing vote:', error);
            throw new AppError(error.message, error.statusCode || StatusCodes.BAD_REQUEST);
        }
    }

    /**
     * Archive topics older than 30 days
     */
    async archiveOldTopics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            // Archive topics using database function
            const { data, error } = await supabase.rpc('archive_old_topics', {
                p_cutoff_date: thirtyDaysAgo
            });

            if (error) throw error;

            // Notify users about archived topics they were mentioned in
            for (const topic of data) {
                if (topic.created_for?.length) {
                    await NotificationService.createBulkNotifications(
                        topic.created_for,
                        'topic_archived',
                        {
                            topic_id: topic.id,
                            description: topic.description
                        }
                    );
                }
            }

            return data;
        } catch (error) {
            logger.error('Error archiving topics:', error);
            throw new AppError('Failed to archive topics', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = new TopicService();