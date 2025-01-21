class RatingService {
    async updateRating(userId, ratingType, value) {
      const { data, error } = await supabase
        .from('user_ratings')
        .upsert([{
          user_id: userId,
          [ratingType]: value
        }], {
          onConflict: 'user_id'
        });
  
      if (error) throw error;
      return data;
    }
  
    async calculateAverageRating(userId) {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('user_id', userId)
        .single();
  
      if (error) throw error;
  
      // Calculate average from all rating parameters
      const ratings = Object.values(data).filter(v => typeof v === 'number');
      return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }
  }
  
  module.exports = new RatingService();