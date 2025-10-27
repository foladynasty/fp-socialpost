-- Migration: Add n8n integration fields to posts table
-- Run this in Supabase SQL Editor

-- Add new fields to posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT ARRAY['linkedin'],
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS published_urls jsonb,
  ADD COLUMN IF NOT EXISTS publish_error text;

-- Update status check constraint to include new statuses
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'publishing', 'published', 'failed'));

-- Create index for scheduler queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_publishing
  ON posts(scheduled_date, status, published_at)
  WHERE status = 'approved' AND published_at IS NULL;

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_posts_status_publishing
  ON posts(status)
  WHERE status IN ('publishing', 'published', 'failed');

-- Add helpful comment
COMMENT ON COLUMN posts.platforms IS 'Array of platforms to post to: linkedin, facebook, instagram';
COMMENT ON COLUMN posts.published_at IS 'Timestamp when post was successfully published via n8n';
COMMENT ON COLUMN posts.published_urls IS 'JSON object containing URLs for each platform: {"linkedin": "url", "facebook": "url"}';
COMMENT ON COLUMN posts.publish_error IS 'Error message if publishing failed';
