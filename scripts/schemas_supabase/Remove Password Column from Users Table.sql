-- Execute in Supabase SQL Editor
-- Alter users table to remove password column since Supabase handles auth
ALTER TABLE users 
DROP COLUMN IF EXISTS password;
