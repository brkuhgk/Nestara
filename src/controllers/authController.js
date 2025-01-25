// src/controllers/authController.js
const supabase = require('../config/supabase');
const { validationResult } = require('express-validator');
const { DEFAULT_RATING } = require('../config/constants');

const authController = {
  async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email,password, phone, name, username,type } = req.body;
      
       // Validate email format
       if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Register with Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            phone,
            name,
            username,
            type: type || 'tenant'
          }
        }
      });

      if (authError) throw authError;
      
      // Create user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email:email.toLowerCase(),
          phone,
          name,
          username,
          type: type || 'tenant'
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Set default ratings for the new user
      const { error: ratingError } = await supabase
        .from('user_ratings')
        .insert([{
          user_id: userData.id,
          rp1: DEFAULT_RATING,
          rp2: DEFAULT_RATING,
          rp3: DEFAULT_RATING,
          rp4: DEFAULT_RATING,
          rp5: DEFAULT_RATING,
          mp1: DEFAULT_RATING,
          mp2: DEFAULT_RATING,
          mp3: DEFAULT_RATING
        }]);

      if (ratingError) throw ratingError;

      res.status(201).json({
        ...userData,
        message: 'Please check your email for verification.'
      });
    } catch (error) {
      // TODO: Handle error log it
      res.status(400).json({ error: error.message });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { email, token } = req.body;

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase(),
        token,
        type: 'signup'  // Changed to signup type for email verification
      });

      if (error) throw error;

      res.json({
        message: 'Email verified successfully. You can now login.',
        user: data.user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async resendOTP(req, res) {
    try {
      const { email } = req.body;
      
      const { data, error } = await supabase.auth.resend({
        email: email.toLowerCase(),
        type: 'signup'  // For signup email verification
      });
  
      if (error) throw error;
  
      res.json({
        message: 'Verification email resent successfully. Please check your email.'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  
  async verifyOTP(req, res) {
    try {
      const { type, otp } = req.body;
      // OTP verification logic here
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) throw error;

      res.json({
        session: data.session,
        user: data.user
      });

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email :email.toLowerCase(),
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