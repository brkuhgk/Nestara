class HouseService {
    async createHouse(houseData, userId) {
      const { data: house, error: houseError } = await supabase
        .from('houses')
        .insert([houseData])
        .single();
  
      if (houseError) throw houseError;
  
      // Add creator as house member
      const { error: memberError } = await supabase
        .from('house_members')
        .insert([{
          house_id: house.id,
          user_id: userId,
          type: 'maintainer',
          status: 'active'
        }]);
  
      if (memberError) throw memberError;
      return house;
    }
  
    async getHouseMembers(houseId) {
      const { data, error } = await supabase
        .from('house_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('house_id', houseId);
  
      if (error) throw error;
      return data;
    }
  
    async addHouseMember(houseId, userId, type = 'tenant') {
      const { data, error } = await supabase
        .from('house_members')
        .insert([{
          house_id: houseId,
          user_id: userId,
          type,
          status: 'pending'
        }])
        .single();
  
      if (error) throw error;
      return data;
    }
  }
  
  module.exports = new HouseService();