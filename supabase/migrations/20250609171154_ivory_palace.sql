/*
  # Fix API Endpoints Authentication Policies

  1. Policy Updates
    - Safely drop and recreate all API endpoint policies
    - Add proper public/private API access controls
    - Ensure anonymous users can access APIs appropriately

  2. Schema Updates
    - Add missing indexes for performance
    - Update existing records with proper defaults

  3. Security
    - Public APIs accessible to everyone
    - Private APIs require API key validation (handled in edge function)
    - Management operations require user authentication
*/

-- Safely drop all existing policies for api_endpoints
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can read own api endpoints" ON api_endpoints;
    DROP POLICY IF EXISTS "Public can read api endpoints for API access" ON api_endpoints;
    DROP POLICY IF EXISTS "Public can read public api endpoints" ON api_endpoints;
    DROP POLICY IF EXISTS "Public can read private api endpoints with valid key" ON api_endpoints;
    DROP POLICY IF EXISTS "Allow anonymous read for public APIs" ON api_endpoints;
    DROP POLICY IF EXISTS "Allow anonymous read for private APIs with key" ON api_endpoints;
    DROP POLICY IF EXISTS "Users can create own api endpoints" ON api_endpoints;
    DROP POLICY IF EXISTS "Users can update own api endpoints" ON api_endpoints;
    DROP POLICY IF EXISTS "Users can delete own api endpoints" ON api_endpoints;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- Create comprehensive policies for API access
-- Policy 1: Allow anonymous read for public APIs
CREATE POLICY "Allow anonymous read for public APIs"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Policy 2: Allow anonymous read for private APIs with key (handled in edge function)
CREATE POLICY "Allow anonymous read for private APIs with key"
  ON api_endpoints
  FOR SELECT
  TO anon, authenticated
  USING ((is_public = false) AND (api_key IS NOT NULL));

-- Policy 3: Users can read their own API endpoints (for management)
CREATE POLICY "Users can read own api endpoints"
  ON api_endpoints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Management policies for authenticated users
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

-- Create indexes for optimal performance (only if they don't exist)
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

-- Ensure all existing APIs have proper API keys for private access
UPDATE api_endpoints 
SET api_key = encode(gen_random_bytes(32), 'hex')
WHERE api_key IS NULL AND is_public = false;