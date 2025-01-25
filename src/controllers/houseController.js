const supabase = require('../config/supabase'); // Ensure this import is present

const houseController = {
  async getHouses(req, res) {
    try {
      const { data, error } = await supabase
        .from('house_members')
        .select('house:houses(*)')
        .eq('user_id', req.user.id);
        console.log('data:', data);

      if (error) throw error;
      res.json(data.map(item => item.house));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async createHouse(req, res) {
    try {
      // Check if req.user is defined
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, address, image_url } = req.body;

      // Validate required fields
      if (!name || !address) {
        return res.status(400).json({ error: 'Name and address are required' });
      }

      // Insert into houses table
      const { data: houseData, error: houseError } = await supabase
        .from('houses')
        .insert([{ name, address, image_url }])
        .select()
        .single();

      if (houseError) throw houseError;

      // Debugging statements
      console.log('houseError:', houseError);
      console.log('houseData:', houseData.id);

      if (houseError) throw houseError;

      if (!houseData) {
        return res.status(400).json({ error: 'Failed to create house' });
      }

      // Add creator as house member
      const { data: memberData, error: memberError } = await supabase
        .from('house_members')
        .insert([{
          house_id: houseData.id,
          user_id: req.user.id,
          type: 'maintainer',
          status: 'active'
        }]);

      if (memberError) throw memberError;

      res.status(201).json(houseData);
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

  async getHouseMembers(req, res) {
    try {
      const { data, error } = await supabase
        .from('house_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('house_id', req.params.id);

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
        }]).select().single();

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
      console.log('house:', house);
      
      // TODO: Send notification to house maintainer to approve join request, if house found.
      // if not return house not found.
      if (!house) {
        return res.status(404).json({ error: 'House not found' });
      }

      if(houseError) throw houseError;

      // Create join request
      const { data, error } = await supabase
        .from('house_members')
        .insert([{
          house_id: house.id,
          user_id: req.user.id,
          type: 'tenant',
          status: 'pending'
        }]).select().single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = houseController;