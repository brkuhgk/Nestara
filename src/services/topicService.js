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
      
      // TODO: DO default voting for the topic.
      

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
   * @param {string} voteType - Vote type (upvote or downvote)
   * @returns {Promise<Object>} Updated topic
   */
  async voteTopic(topicId, userId, voteType) {
    try {
      // Fetch the last vote by the user for this topic
      const { data: lastVote, error: lastVoteError } = await supabase
        .from('topic_votes')
        .select('vote_type')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastVoteError && lastVoteError.code !== 'PGRST116') {
        throw new AppError('Failed to check last vote', StatusCodes.BAD_REQUEST);
      }

      // Prevent consecutive same votes
      if (lastVote && lastVote.vote_type === voteType) {
        throw new AppError('Cannot vote the same way consecutively', StatusCodes.BAD_REQUEST);
      }

      // Fetch current votes and roommates count
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('votes, house_id')
        .eq('id', topicId)
        .single();

      console.log("house id is fetched", topic.house_id);

      if (topicError || !topic) throw new AppError('Topic not found', StatusCodes.NOT_FOUND);

      const { data: roommates, error: roommatesError } = await supabase
        .from('house_members')
        .select('user_id')
        .eq('house_id', topic.house_id);

      console.log("Roommates are fetched", roommates);

      if (roommatesError) throw new AppError('Failed to fetch roommates', StatusCodes.BAD_REQUEST);

      const roommatesCount = roommates.length;
      let newVotes = topic.votes;

      // Update vote count
      if (voteType === 'upvote') {
        newVotes += 1;
      } else if (voteType === 'downvote') {
        newVotes -= 1;
      } else {
        throw new AppError('Invalid vote type', StatusCodes.BAD_REQUEST);
      }

      // Insert the new vote into the topic_votes table
      const { data: insertVoteData, error: insertVoteError } = await supabase
        .from('topic_votes')
        .insert([{ topic_id: topicId, user_id: userId, vote_type: voteType }])
        .select();

      if (insertVoteError) throw new AppError('Failed to record vote', StatusCodes.BAD_REQUEST);

      // Check if votes are less than 50% of roommates count
      const current_status = newVotes < (roommatesCount / 2) ? 'inactive' : 'active';

      // Update topic with new vote count and status
      const { data: updatedTopic, error: updateError } = await supabase
        .from('topics')
        .update({ votes: newVotes, status:current_status})
        .eq('id', topicId)
        .select()
        .single();
      console.log("Topic is updated", updatedTopic);
      console.log("Topic Error", updateError);
      if (updateError) throw new AppError('Failed to update topic', StatusCodes.BAD_REQUEST);

      return updatedTopic;
    } catch (error) {
      throw new AppError(error.message, StatusCodes.BAD_REQUEST);
    }
  }

  /**
   * Vote on a topic using a database function
   * @param {UUID} topicId - Topic ID
   * @param {UUID} userId - User ID
   * @param {string} voteType - Vote type (upvote or downvote)
   * @returns {Promise<Object>} Updated topic
   */
  async voteTopicByDbFunction(topicId, userId, voteType) {
    try {
      // Fetch the last vote by the user for this topic
      const { data: lastVote, error: lastVoteError } = await supabase
        .from('topic_votes')
        .select('vote_type')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastVoteError && lastVoteError.code !== 'PGRST116') {
        throw new AppError('Failed to check last vote', StatusCodes.BAD_REQUEST);
      }

      // Prevent consecutive same votes
      if (lastVote && lastVote.vote_type === voteType) {
        throw new AppError('Cannot vote the same way consecutively', StatusCodes.BAD_REQUEST);
      }

      // Determine the vote change
      const voteChange = voteType === 'upvote' ? 1 : voteType === 'downvote' ? -1 : 0;
      if (voteChange === 0) {
        throw new AppError('Invalid vote type', StatusCodes.BAD_REQUEST);
      }
      console.log("topic id is", topicId);
      console.log("user id is", userId);
      console.log("vote type is", voteType);

      // Insert the new vote into the topic_votes table
      const { data: insertVoteData , error: insertVoteError } = await supabase
        .from('topic_votes')
        .insert([{ topic_id: topicId, user_id: userId, vote_type: voteType }])
        .select();

      console.log("Vote is inserted", insertVoteData);
      if (insertVoteError) throw new AppError('Failed to record vote', StatusCodes.BAD_REQUEST);

      // Update the vote count using the database function
      await this.updateTopicVoteCount(topicId, voteChange);

      // Fetch the updated topic
      const { data: updatedTopic, error: updateError } = await supabase
        .from('topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (updateError) throw new AppError('Failed to fetch updated topic', StatusCodes.BAD_REQUEST);

      return updatedTopic;
    } catch (error) {
      throw new AppError(error.message, StatusCodes.BAD_REQUEST);
    }
  }

  /**
   * Update topic vote count using a database function
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
      
      console.log("Topics are fetched", data);
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