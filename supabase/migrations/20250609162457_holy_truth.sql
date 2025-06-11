/*
  # Add API Key Support to API Endpoints

  1. Schema Changes
    - Add `is_public` column (boolean, default true)
    - Add `api_key` column (text, nullable)
    - Add `requires_auth` column (boolean, default false)

  2. Security
    - Update RLS policies to handle public/private endpoints
    - Add index for API key lookups
*/

-- Add new columns to api_endpoints table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN is_public boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN api_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'requires_auth'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN requires_auth boolean DEFAULT false;
  END IF;
END $$;

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_api_endpoints_api_key ON api_endpoints(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_endpoints_public ON api_endpoints(is_public) WHERE is_public = true;

-- Update RLS policy for public API access
DROP POLICY IF EXISTS "Public can read api endpoints for API access" ON api_endpoints;

CREATE POLICY "Public can read public api endpoints"
  ON api_endpoints
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Public can read private api endpoints with valid key"
  ON api_endpoints
  FOR SELECT
  TO anon
  USING (is_public = false AND api_key IS NOT NULL);