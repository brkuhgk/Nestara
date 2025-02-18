-- Add the status column to the topics table
ALTER TABLE topics
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Update existing topics to have a default status of 'active'
UPDATE topics
SET status = 'active'
WHERE status IS NULL;