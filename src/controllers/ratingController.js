const supabase = require('../config/supabase');
const { successResponse } = require('../utils/response');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const { RATING_PARAMETERS } = require('../config/ratingConstants');

const ratingController = {
  // Get user's current ratings
  async getUserRatings(req, res) {
    try {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', req.params.userId)
        .single();

      
      if (!data) throw new AppError('Ratings not found', StatusCodes.NOT_FOUND);
      if (error) throw error;
      // Format ratings with parameter names
      const formattedRatings = Object.entries(data)
        .filter(([key]) => key.startsWith('rp') || key.startsWith('mp'))
        .map(([key, value]) => ({
          parameter: key,
          value,
          name: RATING_PARAMETERS[key.startsWith('rp') ? 'TENANT' : 'MAINTAINER'][key].name,
          description: RATING_PARAMETERS[key.startsWith('rp') ? 'TENANT' : 'MAINTAINER'][key].description
        }));

      return successResponse(res, formattedRatings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get user's rating history
  async getRatingHistory(req, res) {
    try {
      const { data, error } = await supabase
        .from('rating_history')
        .select('*')
        .eq('user_id', req.params.userId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      return successResponse(res, data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Update user's rating (admin only)
  async updateRating(req, res) {
    try {
      const { parameter, value, reason, topicType } = req.body;
      const userId = req.params.userId;

      // Get current rating
      const { data: currentRating } = await supabase
        .from('user_ratings')
        .select(parameter)
        .eq('user_id', userId)
        .single();

      if (!currentRating) throw new AppError('User ratings not found', StatusCodes.NOT_FOUND);

      const oldValue = currentRating[parameter];
      let newValue;

      // Adjust rating based on topic type
      if (topicType === 'mentions') {
        newValue = Math.min(1000, oldValue + value);
      } else if (topicType === 'conflict') {
        newValue = Math.max(0, oldValue - value);
      } else {
        throw new AppError('Invalid topic type', StatusCodes.BAD_REQUEST);
      }

      // Update rating
      const { data, error } = await supabase
        .from('user_ratings')
        .update({ [parameter]: newValue })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Record history
      await supabase
        .from('rating_history')
        .insert({
          user_id: userId,
          old_values: { [parameter]: oldValue },
          new_values: { [parameter]: newValue },
          reason,
          changed_at: new Date()
        });

      return successResponse(res, data, 'Rating updated successfully');
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = ratingController;