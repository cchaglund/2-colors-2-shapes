-- Add groups column to submissions table for storing layer groups
-- Groups contain: id, name, isCollapsed, zIndex
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS groups JSONB DEFAULT '[]';
