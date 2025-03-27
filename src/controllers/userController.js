const supabase = require('../config/supabase'); // Ensure this import is present
const s3Service = require('../services/s3Service');
const logger = require('../config/logger');

// src/controllers/userController.js
const userController = {
    async getProfile(req, res) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', req.user.id)
          .single();
        console.log("profile",data)
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
        const { name, bio, image_key } = req.body;
        const updateData = { name, bio };
  
        // If new image was uploaded, generate view URL
        if (image_key) {
          // Delete old image if exists
          const { data: user } = await supabase
            .from('users')
            .select('image_key')
            .eq('id', req.user.id)
            .single();
          console.log("user",user)
          if (user?.image_key) {
            await s3Service.deleteFile(user.image_key);
          }
  
          updateData.image_key = image_key;
        }
  
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', req.user.id)
          .single();
  
        if (error) throw error;
  
        // If profile has image, get the view URL
        if (data.image_key) {
          data.image_url = await s3Service.getDownloadUrl(data.image_key);
        }
  
        res.json(data);
      } catch (error) {
        logger.error('Error updating profile:', error);
        res.status(400).json({ error: error.message });
      }
    },
    
  };
  
  module.exports = userController;