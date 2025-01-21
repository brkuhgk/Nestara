class TopicService {
    async createTopic(topicData, userId) {
      const { data, error } = await supabase
        .from('topics')
        .insert([{
          ...topicData,
          created_by: userId
        }])
        .single();
  
      if (error) throw error;
      return data;
    }
  
    async getHouseTopics(houseId) {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          created_by:users(id, name),
          topic_votes(count)
        `)
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      return data;
    }
  
    async voteTopic(topicId, userId, voteType) {
      const { data, error } = await supabase
        .from('topic_votes')
        .upsert([{
          topic_id: topicId,
          user_id: userId,
          vote: voteType
        }], {
          onConflict: 'topic_id,user_id'
        });
  
      if (error) throw error;
      return data;
    }
  }
  
  module.exports = new TopicService();