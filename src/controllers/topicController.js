const topicController = {
    async getTopics(req, res) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('house_id', req.query.houseId)
          .order('created_at', { ascending: false });
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    async createTopic(req, res) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .insert([{
            ...req.body,
            created_by: req.user.id
          }])
          .single();
  
        if (error) throw error;
        res.status(201).json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    async getTopic(req, res) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*, created_by:users(*)')
          .eq('id', req.params.id)
          .single();
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    async voteTopic(req, res) {
      try {
        const { data, error } = await supabase
          .from('topic_votes')
          .insert([{
            topic_id: req.params.id,
            user_id: req.user.id,
            vote: req.body.vote
          }]);
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  };
  
  module.exports = topicController;