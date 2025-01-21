class TimeBlockService {
    async createTimeBlock(blockData) {
      // Check for existing blocks in the time range
      const { data: existing } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('house_location_id', blockData.locationId)
        .eq('date', blockData.date)
        .overlaps('start_time', blockData.startTime, 'end_time', blockData.endTime);
  
      if (existing?.length > 0) {
        throw new Error('Time slot already booked');
      }
  
      const { data, error } = await supabase
        .from('time_blocks')
        .insert([blockData])
        .single();
  
      if (error) throw error;
      return data;
    }
  
    async getLocationTimeBlocks(locationId, date) {
      const { data, error } = await supabase
        .from('time_blocks')
        .select(`
          *,
          user:users(id, name)
        `)
        .eq('house_location_id', locationId)
        .eq('date', date)
        .order('start_time', { ascending: true });
  
      if (error) throw error;
      return data;
    }
  }
  
  module.exports = new TimeBlockService();