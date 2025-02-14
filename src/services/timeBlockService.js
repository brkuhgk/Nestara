const supabase = require('../config/supabase');
const logger = require('../config/logger');

class TimeBlockService {
  async createTimeBlock(timeBlockData) {
    try {
      const { 
        house_id, 
        user_id, 
        location,
        date,
        start_time,
        end_time 
      } = timeBlockData;

      // Create time block
      const { data, error } = await supabase
        .from('time_blocks')
        .insert([{
          house_id,
          user_id,
          location,
          date,
          start_time,
          end_time
        }])
        .select(`
          *,
          user:users(id, name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating time block:', error);
      throw error;
    }
  }

  async getTimeBlocks(houseId, date) {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('house_id', houseId)
        .eq('date', date)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching time blocks:', error);
      throw error;
    }
  }

  async deleteTimeBlock(id, userId) {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .match({ id, user_id: userId });

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting time block:', error);
      throw error;
    }
  }

  async getTimeBlocksByUser(userId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching user time blocks:', error);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new TimeBlockService();