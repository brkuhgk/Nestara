// src/controllers/authController.js
const supabase = require('../config/supabase');

const authController = {
  async register(req, res) {
    try {
      const { email, phone, name, username } = req.body;
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: req.body.password
      });

      if (authError) throw authError;

      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          phone,
          name,
          username,
          type: req.body.type || 'tenant'
        }])
        .single();

      if (userError) throw userError;

      res.status(201).json(userData);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async verifyOTP(req, res) {
    try {
      const { type, otp } = req.body;
      // OTP verification logic here
      res.json({ message: 'OTP verified successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
};

module.exports = authController;



/**
 * // Example of updated controller using service
const userService = require('../services/userService');

// In authController.js
const register = async (req, res) => {
  try {
    const userData = await userService.createUser(req.body);
    res.status(201).json(userData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
 */