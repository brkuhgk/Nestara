class NotificationService {
    async sendNotification(userId, type, data) {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type,
          data,
          read: false
        }])
        .single();
  
      if (error) throw error;
      return notification;
    }
  
    async getUserNotifications(userId) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      return data;
    }
  }
  
  module.exports = new NotificationService();