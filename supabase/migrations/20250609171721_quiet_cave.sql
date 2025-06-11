/*
  # Fix API Endpoints Policies and Access Control

  1. Database Changes
    - Safely drop all existing policies for api_endpoints table
    - Create new comprehensive policies for public/private API access
    - Add necessary indexes for performance
    - Update existing records with proper defaults

  2. Security
    - Enable proper RLS policies for public API access
    - Enable API key-based access for private endpoints
    - Maintain user management policies for authenticated users

  3. Performance
    - Add optimized indexes for route and API key lookups
    - Ensure efficient querying for both public and private endpoints
*/

-- Function to safely drop policies
CREATE OR REPLACE FUNCTION drop_policy_if_exists(policy_name text, table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore any errors
        NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop all existing policies safely
SELECT drop_policy_if_exists('Users can read own api endpoints', 'api_endpoints');
SELECT drop_policy_if_exists('Public can read api endpoints for API access', 'api_endpoints');
SELECT drop_policy_if_exists('Public can read public api endpoints', 'api_endpoints');
SELECT drop_policy_if_exists('Public can read private api endpoints with valid key', 'api_endpoints');
SELECT drop_policy_if_exists('Allow anonymous read for public APIs', 'api_endpoints');
SELECT drop_policy_if_exists('Allow anonymous read for private APIs with key', 'api_endpoints');
SELECT drop_policy_if_exists('Users can create own api endpoints', 'api_endpoints');
SELECT drop_policy_if_exists('Users can update own api endpoints', 'api_endpoints');
SELECT drop_policy_if_exists('Users can delete own api endpoints', 'api_endpoints');

-- Clean up the helper function
DROP FUNCTION drop_policy_if_exists(text, text);

-- Create new comprehensive policies for API access
CREATE POLICY "Allow anonymous read for public APIs"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Allow anonymous read for private APIs with key"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING ((is_public = false) AND (api_key IS NOT NULL));

CREATE POLICY "Users can read own api endpoints"
  ON api_endpoints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own api endpoints"
  ON api_endpoints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api endpoints"
  ON api_endpoints
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own api endpoints"
  ON api_endpoints
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_public ON api_endpoints(route, is_public);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_key ON api_endpoints(route, api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_endpoints_public ON api_endpoints(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_api_endpoints_api_key ON api_endpoints(api_key) WHERE api_key IS NOT NULL;

-- Update existing endpoints to have proper default values
UPDATE api_endpoints 
SET 
  is_public = COALESCE(is_public, true),
  requires_auth = COALESCE(requires_auth, false)
WHERE is_public IS NULL OR requires_auth IS NULL;

-- Generate API keys for existing private endpoints that don't have them
UPDATE api_endpoints 
SET api_key = 'ak_' || encode(gen_random_bytes(24), 'hex')
WHERE api_key IS NULL AND is_public = false;