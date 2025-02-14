// middleware/auth/authenticate.js

const { StatusCodes } = require('http-status-codes');
const supabase = require('../../config/supabase');
const AppError = require('../../utils/AppError');

const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', StatusCodes.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            console.error('[Auth] Token verification failed:', error);
            throw new AppError('Invalid token', StatusCodes.UNAUTHORIZED);
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('[Auth] Authentication error:', error);
        res.status(error.statusCode || StatusCodes.UNAUTHORIZED)
            .json({ error: error.message || 'Authentication failed' });
    }
};

module.exports = authenticate;