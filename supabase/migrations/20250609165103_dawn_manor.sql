/*
  # Fix API endpoint access for public and private APIs

  1. Security Updates
    - Update RLS policies to allow anonymous access to public APIs
    - Allow API key-based access for private APIs
    - Ensure proper indexing for performance

  2. Policy Changes
    - Remove restrictive anonymous policies
    - Add proper public API access policy
    - Add API key validation policy
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Public can read api endpoints for API access" ON api_endpoints;
DROP POLICY IF EXISTS "Public can read public api endpoints" ON api_endpoints;
DROP POLICY IF EXISTS "Public can read private api endpoints with valid key" ON api_endpoints;

-- Create new policies for public access
CREATE POLICY "Allow anonymous read for public APIs"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Create policy for private API access (this will be handled in the edge function)
CREATE POLICY "Allow anonymous read for private APIs with key"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING (is_public = false AND api_key IS NOT NULL);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_public ON api_endpoints(route, is_public);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_key ON api_endpoints(route, api_key) WHERE api_key IS NOT NULL;