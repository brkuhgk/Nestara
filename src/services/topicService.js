// src/services/topicService.js
const supabase = require('../config/supabase');
const RatingService = require('./ratingService');
const NotificationService = require('./notificationService');
const { TOPIC_TYPES } = require('../config/constants');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');

class TopicService {
  /**
   * Create a new topic
   * @param {Object} topicData - Topic data including house_id, description, type, etc.
   * @param {UUID} createdBy - User ID who created the topic
   * @returns {Promise<Object>} Created topic
   */
  async createTopic(topicData, createdBy) {
    const { house_id, description, type, created_for, rating_parameter, images } = topicData;

    try {
      // Validate topic type
      if (!Object.values(TOPIC_TYPES).includes(type)) {
        throw new AppError('Invalid topic type', StatusCodes.BAD_REQUEST);
      }

      // Validate rating parameter if topic type is not general
      if (!rating_parameter) {
        throw new AppError('Rating parameter required for topics', StatusCodes.BAD_REQUEST);
      }

      // Create topic
      const { data: topic, error } = await supabase
        .from('topics')
        .insert([{
          house_id,
          created_by: createdBy,
          created_for: created_for || [],
          type,
          description,
          rating_parameter,
          images: images || [],
          status: 'active'
        }]).select()
        .single();
      console.log("Topic is created", topic);

      if (error) throw error;

      // // TODO: Remove here Schedule rating updates for conflict/mentions
      // if (type === TOPIC_TYPES.CONFLICT) {
      //   // Schedule negative rating update after 30 days
      //   await this.scheduleRatingUpdate(topic.id, -50);
      // } else if (type === TOPIC_TYPES.MENTIONS) {
      //   // Schedule positive rating update after 30 days
      //   await this.scheduleRatingUpdate(topic.id, 50);
      // }

      // TODO : Notify mentioned users
      // if (created_for && created_for.length > 0) {
      //   await this.notifyMentionedUsers(topic, createdBy);
      // }

      return topic;
    } catch (error) {
      throw new AppError(error.message, StatusCodes.BAD_REQUEST);
    }
  }

  /**
   * Schedule rating update for a topic
   * @param {UUID} topicId - Topic ID
   * @param {number} ratingChange - Amount to change rating by
   */
  async scheduleRatingUpdate(topicId, ratingChange) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 days from now

    const { data: topic } = await supabase
      .from('topics')
      .select('created_for, rating_parameter')
      .eq('id', topicId)
      .single();

    // Schedule rating update for each mentioned user
    for (const userId of topic.created_for) {
      await RatingService.scheduleRatingUpdate(
        userId,
        topicId,
        topic.rating_parameter,
        ratingChange,
        scheduledDate

      );
    }
  }

  /**
   * Vote on a topic
   * @param {UUID} topicId - Topic ID
   * @param {UUID} userId - User ID
   * @param {string} voteType - 'upvote' or 'downvote'
   */
  async voteTopic(topicId, userId, voteType) {
    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('topic_votes')
        .select('*')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if same type
          await supabase
            .from('topic_votes')
            .delete()
            .eq('id', existingVote.id);

          await this.updateTopicVoteCount(topicId, -1);
        } else {
          // Update vote type if different
          await supabase
            .from('topic_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('topic_votes')
          .insert([{
            topic_id: topicId,
            user_id: userId,
            vote_type: voteType
          }]);

        await this.updateTopicVoteCount(topicId, 1);
      }

      return await this.getTopicById(topicId);
    } catch (error) {
      throw new AppError('Failed to process vote', StatusCodes.BAD_REQUEST);
    }
  }

  /**
   * Update topic vote count
   * @param {UUID} topicId - Topic ID
   * @param {number} change - Amount to change vote count by
   */
  async updateTopicVoteCount(topicId, change) {
    await supabase.rpc('update_topic_votes', {
      topic_id: topicId,
      vote_change: change
    });
  }

  /**
   * Get topics for a house
   * @param {UUID} houseId - House ID
   * @param {Object} filters - Filter options
   */
  async getHouseTopics(houseId) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          created_by:users!created_by(id, name),
          votes:topic_votes(count)
        `)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new AppError('Failed to fetch topics', StatusCodes.BAD_REQUEST);
    }
  }

  /**
   * Archive old topics
   * Archives topics older than 30 days
   */
  async archiveOldTopics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const { data, error } = await supabase
        .from('topics')
        .update({
          status: 'archived',
          archived_at: new Date()
        })
        .lt('created_at', thirtyDaysAgo)
        .eq('status', 'active');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new AppError('Failed to archive topics', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Notify mentioned users about a topic
   * @param {Object} topic - Topic object
   * @param {UUID} createdBy - User ID who created the topic
   */
  async notifyMentionedUsers(topic, createdBy) {
    const { data: creator } = await supabase
      .from('users')
      .select('name')
      .eq('id', createdBy)
      .single();

    for (const userId of topic.created_for) {
      await NotificationService.createNotification(userId, 'topic_mention', {
        topic_id: topic.id,
        created_by: creator.name,
        type: topic.type,
        description: topic.description
      });
    }
  }
}

module.exports = new TopicService();