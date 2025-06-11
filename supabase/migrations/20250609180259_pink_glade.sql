/*
  # Fix API routing and remove unique route constraints

  1. Schema Changes
    - Remove unique constraint on route column to allow multiple endpoints per route
    - Add proper check constraint for route format
    - Create optimized indexes for route lookups

  2. Security
    - Maintain RLS policies
    - Allow both public and private endpoints on same route

  3. Performance
    - Add indexes for efficient route and API key lookups
*/

-- Drop the unique constraint first (this will also drop the associated index)
ALTER TABLE api_endpoints DROP CONSTRAINT IF EXISTS unique_route;

-- Drop any remaining indexes that might conflict
DROP INDEX IF EXISTS idx_api_endpoints_route_unique;

-- Add a check constraint to ensure routes start with /
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'route_format_check'
  ) THEN
    ALTER TABLE api_endpoints ADD CONSTRAINT route_format_check CHECK (route ~ '^/.*');
  END IF;
END $$;

-- Create optimized indexes for route lookups
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route ON api_endpoints(route);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_public ON api_endpoints(route, is_public);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_key ON api_endpoints(route, api_key) WHERE api_key IS NOT NULL;

-- Create a partial unique index that prevents true duplicates while allowing
-- both public and private endpoints on the same route
CREATE UNIQUE INDEX IF NOT EXISTS unique_route_access_combination 
ON api_endpoints(route, is_public, COALESCE(api_key, '')) 
WHERE is_public = true OR (is_public = false AND api_key IS NOT NULL);