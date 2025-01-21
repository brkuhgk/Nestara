const supabase = require('../config/supabase');

class UserService {
  async createUser(userData) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (authError) throw authError;

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: userData.email,
        phone: userData.phone,
        name: userData.name,
        username: userData.username,
        type: userData.type || 'tenant'
      }])
      .single();

    if (error) throw error;
    return data;
  }

  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new UserService();