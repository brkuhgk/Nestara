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



    /**
   * Get vote status for a topic
   * @param {string} topicId - Topic ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Vote status
   */
    async getVoteStatus(topicId, userId) {
      try {
        // First verify if topic exists
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('id, house_id')
          .eq('id', topicId)
          .single();
  
        if (topicError || !topic) {
          throw new AppError('Topic not found', StatusCodes.NOT_FOUND);
        }
  
        // Get all votes for this topic
        const { data: allVotes, error: votesError } = await supabase
          .from('topic_votes')
          .select('vote_type, user_id, created_at')
          .eq('topic_id', topicId);
  
        if (votesError) {
          throw new AppError('Failed to fetch votes', StatusCodes.BAD_REQUEST);
        }
  
        // Get user's last vote
        const userVotes = allVotes?.filter(vote => vote.user_id === userId) || [];
        const lastVote = userVotes.length > 0 ? 
          userVotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : 
          null;
  
        // Calculate vote counts
        const upvotes = allVotes?.filter(vote => vote.vote_type === 'upvote').length || 0;
        const downvotes = allVotes?.filter(vote => vote.vote_type === 'downvote').length || 0;
  
        return {
          currentVote: lastVote?.vote_type || null,
          canVote: true,
          nextAllowedVote: lastVote ? 
            (lastVote.vote_type === 'upvote' ? 'downvote' : 'upvote') : 
            'both',
          voteCounts: {
            upvotes,
            downvotes,
            total: upvotes - downvotes
          }
        };
      } catch (error) {
        console.error('[TopicService] Get vote status error:', error);
        throw new AppError(
          error.message || 'Failed to get vote status',
          error.statusCode || StatusCodes.BAD_REQUEST
        );
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
        console.log('[TopicService] Processing vote:', { topicId, userId, voteType });
    
        // First verify if topic exists and get house_id
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', topicId)
          .single();
    
        if (topicError || !topic) {
          console.error('[TopicService] Topic not found:', topicError);
          throw new AppError('Topic not found', StatusCodes.NOT_FOUND);
        }
    
        // Get last vote by user for this topic
        const { data: lastVotes, error: lastVoteError } = await supabase
          .from('topic_votes')
          .select('*')
          .eq('topic_id', topicId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
    
        console.log('[TopicService] Last votes:', lastVotes);
    
        const lastVote = lastVotes && lastVotes.length > 0 ? lastVotes[0] : null;
    
        // Check for consecutive same votes
        if (lastVote && lastVote.vote_type === voteType) {
          throw new AppError('Cannot vote the same way consecutively', StatusCodes.BAD_REQUEST);
        }
    
        // Delete any previous votes by this user for this topic
        if (lastVote) {
          console.log('[TopicService] Deleting previous vote');
          const { error: deleteError } = await supabase
            .from('topic_votes')
            .delete()
            .eq('topic_id', topicId)
            .eq('user_id', userId);
    
          if (deleteError) {
            console.error('[TopicService] Delete error:', deleteError);
            throw new AppError('Failed to update vote', StatusCodes.BAD_REQUEST);
          }
        }
    
        // Insert new vote
        console.log('[TopicService] Inserting new vote');
        const { data: newVote, error: insertError } = await supabase
          .from('topic_votes')
          .insert([{
            topic_id: topicId,
            user_id: userId,
            vote_type: voteType
          }])
          .select()
          .single();
    
        if (insertError) {
          console.error('[TopicService] Insert error:', insertError);
          throw new AppError('Failed to record vote', StatusCodes.BAD_REQUEST);
        }
    
        // Get all votes for counting
        const { data: allVotes, error: countError } = await supabase
          .from('topic_votes')
          .select('vote_type')
          .eq('topic_id', topicId);
    
        if (countError) {
          console.error('[TopicService] Count error:', countError);
          throw new AppError('Failed to count votes', StatusCodes.BAD_REQUEST);
        }
    
        const upvotes = allVotes.filter(v => v.vote_type === 'upvote').length;
        const downvotes = allVotes.filter(v => v.vote_type === 'downvote').length;
        const netVotes = upvotes - downvotes;
    
        console.log('[TopicService] Vote counts:', { upvotes, downvotes, netVotes });
    
        // Update topic with new vote counts
        const { data: updatedTopic, error: updateError } = await supabase
          .from('topics')
          .update({
            votes: [{
              count: netVotes,
              upvotes,
              downvotes
            }]
          })
          .eq('id', topicId)
          .select('*, created_by(*)')
          .single();
    
        if (updateError) {
          console.error('[TopicService] Update error:', updateError);
          throw new AppError('Failed to update topic', StatusCodes.BAD_REQUEST);
        }
    
        return updatedTopic;
      } catch (error) {
        console.error('[TopicService] Vote error:', error);
        throw new AppError(
          error.message || 'Failed to process vote',
          error.statusCode || StatusCodes.BAD_REQUEST
        );
      }
    }

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
  async getHouseTopics(houseId, userId) {
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

      // Transform data to include user's vote status
    const transformedData = data.map(topic => {
      const userVote = topic.votes.find(vote => vote.user_id === userId);
      return {
        ...topic,
        userVoteType: userVote ? userVote.vote_type : null
      };
    });

    return transformedData;

    // return data;
      // return data;
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