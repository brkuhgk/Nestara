// src/controllers/houseController.js
const houseController = {
  async getHouses(req, res) {
    try {
      const { data, error } = await supabase
        .from('house_members')
        .select('house:houses(*)')
        .eq('user_id', req.user.id);

      if (error) throw error;
      res.json(data.map(item => item.house));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async createHouse(req, res) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .insert([req.body])
        .single();

      if (error) throw error;

      // Add creator as house member
      await supabase
        .from('house_members')
        .insert([{
          house_id: data.id,
          user_id: req.user.id,
          type: 'maintainer',
          status: 'active'
        }]);

      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getHouse(req, res) {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select(`
          *,
          members:house_members(
            user:users(*)
          )
        `)
        .eq('id', req.params.id)
        .single();

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async addMember(req, res) {
    try {
      const { data, error } = await supabase
        .from('house_members')
        .insert([{
          house_id: req.params.id,
          user_id: req.body.userId,
          type: req.body.type || 'tenant'
        }]);

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async joinHouse(req, res) {
    try {
      // Find house by address
      const { data: house, error: houseError } = await supabase
        .from('houses')
        .select('id')
        .eq('address', req.body.address)
        .single();

      if (houseError) throw houseError;

      // Create join request
      const { data, error } = await supabase
        .from('house_members')
        .insert([{
          house_id: house.id,
          user_id: req.user.id,
          type: 'tenant',
          status: 'pending'
        }]);

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = houseController;