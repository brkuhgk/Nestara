-- User Ratings Table: Stores current rating values for each user
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    -- Tenant rating parameters (0-1000)
    rp1 INTEGER CHECK (rp1 BETWEEN 0 AND 1000), -- Cleanliness
    rp2 INTEGER CHECK (rp2 BETWEEN 0 AND 1000), -- Behavior and cooperation
    rp3 INTEGER CHECK (rp3 BETWEEN 0 AND 1000), -- Rental and payment history
    rp4 INTEGER CHECK (rp4 BETWEEN 0 AND 1000), -- Maintenance and repairs timeliness
    rp5 INTEGER CHECK (rp5 BETWEEN 0 AND 1000), -- Communication and professionalism
    -- Maintainer rating parameters (0-1000)
    mp1 INTEGER CHECK (mp1 BETWEEN 0 AND 1000), -- Communication and professionalism
    mp2 INTEGER CHECK (mp2 BETWEEN 0 AND 1000), -- Behavior and cooperation
    mp3 INTEGER CHECK (mp3 BETWEEN 0 AND 1000), -- Maintenance and repairs timeliness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rating History Table: Tracks all rating changes
CREATE TABLE rating_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    old_values JSONB NOT NULL, -- Previous rating values
    new_values JSONB NOT NULL, -- Updated rating values
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT -- Why the rating was changed
);

-- Rating Updates Table: For periodic/scheduled rating updates
CREATE TABLE rating_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    house_id UUID REFERENCES houses(id) NOT NULL,
    parameter_key TEXT NOT NULL, -- Which rating parameter to update
    update_value INTEGER NOT NULL CHECK (update_value BETWEEN -100 AND 100), -- Value to add/subtract
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rating Notifications Table: For tracking rating-related notifications
CREATE TABLE rating_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL, -- Type of notification (rating_changed, rating_low, etc.)
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX idx_rating_history_user_id ON rating_history(user_id);
CREATE INDEX idx_rating_updates_scheduled ON rating_updates(scheduled_for) WHERE NOT processed;
CREATE INDEX idx_rating_notifications_unread ON rating_notifications(user_id) WHERE NOT read;