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
      // Validate time block
      if (start_time >= end_time) {
        throw new AppError('End time must be after start time', StatusCodes.BAD_REQUEST);
      }

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

    if (error) {
        if (error.message.includes('overlaps')) {
          throw new AppError('Time block overlaps with existing block', StatusCodes.CONFLICT);
        }
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('Error creating time block:', error);
      throw error;
    }
  }

  async getTimeBlocks(houseId, date) {
    try {

      console.log("======================== data ==================================", date);
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
      // Verify user owns the time block
      const { data: block, error: fetchError } = await supabase
        .from('time_blocks')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError || !block) {
        throw new AppError('Time block not found', StatusCodes.NOT_FOUND);
      }

      if (block.user_id !== userId) {
        throw new AppError('Not authorized to delete this time block', StatusCodes.FORBIDDEN);
      }

      const { error: deleteError } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
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