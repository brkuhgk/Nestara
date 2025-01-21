// src/controllers/userController.js
const userController = {
    async getProfile(req, res) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', req.user.id)
          .single();
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    async getUserRatings(req, res) {
      try {
        const { data, error } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', req.params.id)
          .single();
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    async updateProfile(req, res) {
      try {
        const { data, error } = await supabase
          .from('users')
          .update(req.body)
          .eq('id', req.user.id)
          .single();
  
        if (error) throw error;
        res.json(data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  };
  
  module.exports = userController;