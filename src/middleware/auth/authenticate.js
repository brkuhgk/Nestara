const { StatusCodes } = require('http-status-codes');
const AppError = require('../../utils/AppError');
const supabase = require('../../config/supabase');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError(
        'Authentication required', 
        StatusCodes.UNAUTHORIZED
      );
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new AppError(
        'Invalid or expired token', 
        StatusCodes.UNAUTHORIZED
      );
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;