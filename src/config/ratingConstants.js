// src/config/ratingConstants.js

// Rating value constraints
exports.RATING_LIMITS = {
    MIN_RATING: 0,
    MAX_RATING: 1000,
    DEFAULT_RATING: 700,
    PENALTY_VALUE: -5,  // Default penalty for negative actions
    REWARD_VALUE: 1     // Default reward for positive actions
};

// Rating parameters for different user types
exports.RATING_PARAMETERS = {
    TENANT: {
        rp1: {
            key: 'cleanliness',
            name: 'Cleanliness',
            description: 'How well the tenant maintains cleanliness'
        },
        rp2: {
            key: 'behavior',
            name: 'Behavior and cooperation',
            description: 'How well the tenant cooperates with others'
        },
        rp3: {
            key: 'payment',
            name: 'Rental and payment history',
            description: 'Timeliness of rent payments'
        },
        rp4: {
            key: 'maintenance',
            name: 'Maintenance and timeliness',
            description: 'How well tenant maintains and reports issues'
        },
        rp5: {
            key: 'communication',
            name: 'Communication and professionalism',
            description: 'Quality of communication with others'
        }
    },
    MAINTAINER: {
        mp1: {
            key: 'communication',
            name: 'Communication and professionalism',
            description: 'Quality of communication with tenants'
        },
        mp2: {
            key: 'behavior',
            name: 'Behavior and cooperation',
            description: 'How well the maintainer coop erates'
        },
        mp3: {
            key: 'maintenance',
            name: 'Maintenance and repairs timeliness',
            description: 'Speed and quality of maintenance work'
        }
    }
};

// Time intervals for periodic updates (in milliseconds)
exports.UPDATE_INTERVALS = {
    DAILY_CHECK: 24 * 60 * 60 * 1000,  // 24 hours
    PENALTY_WAIT: 30 * 24 * 60 * 60 * 1000  // 30 days
};

// Notification types for rating changes
exports.NOTIFICATION_TYPES = {
    RATING_DECREASE: 'rating_decrease',
    RATING_INCREASE: 'rating_increase',
    RATING_LOW: 'rating_low',
    RATING_WARNING: 'rating_warning'
};

// Rating thresholds for notifications
exports.RATING_THRESHOLDS = {
    LOW_RATING: 300,
    WARNING_RATING: 500,
    SIGNIFICANT_CHANGE: 50  // Notify if rating changes by this amount
};