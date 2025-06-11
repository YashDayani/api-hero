/*
  # Add route constraints and prevent duplicate routes

  1. Schema Changes
    - Add unique constraint on route column to prevent duplicates
    - Add check constraint to ensure routes start with /

  2. Data Cleanup
    - Remove any duplicate routes (keeping the most recent one)
    - Fix any routes that don't start with /

  3. Performance
    - Add index for faster route lookups
*/

-- First, let's clean up any existing duplicate routes
-- Keep only the most recent API for each route
DELETE FROM api_endpoints 
WHERE id NOT IN (
  SELECT DISTINCT ON (route) id 
  FROM api_endpoints 
  ORDER BY route, created_at DESC
);

-- Ensure all routes start with /
UPDATE api_endpoints 
SET route = '/' || route 
WHERE route IS NOT NULL 
  AND route != '' 
  AND NOT route LIKE '/%';

-- Set empty routes to /
UPDATE api_endpoints 
SET route = '/' 
WHERE route IS NULL OR route = '';

-- Add unique constraint on route to prevent duplicates
ALTER TABLE api_endpoints 
ADD CONSTRAINT unique_route UNIQUE (route);

-- Add check constraint to ensure routes start with /
ALTER TABLE api_endpoints 
ADD CONSTRAINT route_format_check 
CHECK (route ~ '^/.*');

-- Add index for faster route lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_unique ON api_endpoints(route);