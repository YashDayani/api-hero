/*
  # Add Schema Support to API Endpoints

  1. New Tables
    - `api_schemas` - Define data structure for endpoints
    - `api_data` - Store actual data entries following the schema

  2. Schema Changes
    - Add `schema_id` to api_endpoints table
    - Add `data_type` field to distinguish between JSON and schema-based endpoints

  3. Security
    - Enable RLS on new tables
    - Add policies for user access control
*/

-- Create api_schemas table
CREATE TABLE IF NOT EXISTS api_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create api_data table
CREATE TABLE IF NOT EXISTS api_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id uuid REFERENCES api_schemas(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add schema support to api_endpoints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'schema_id'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN schema_id uuid REFERENCES api_schemas(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'data_type'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN data_type text DEFAULT 'json' CHECK (data_type IN ('json', 'schema'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE api_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_data ENABLE ROW LEVEL SECURITY;

-- Policies for api_schemas
CREATE POLICY "Users can read own schemas"
  ON api_schemas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schemas"
  ON api_schemas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schemas"
  ON api_schemas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schemas"
  ON api_schemas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies for api_data
CREATE POLICY "Users can read own data"
  ON api_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own data"
  ON api_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON api_data FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON api_data FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_schemas_project_id ON api_schemas(project_id);
CREATE INDEX IF NOT EXISTS idx_api_schemas_user_id ON api_schemas(user_id);
CREATE INDEX IF NOT EXISTS idx_api_data_schema_id ON api_data(schema_id);
CREATE INDEX IF NOT EXISTS idx_api_data_user_id ON api_data(user_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_schema_id ON api_endpoints(schema_id);

-- Add triggers for updated_at
CREATE TRIGGER update_api_schemas_updated_at
  BEFORE UPDATE ON api_schemas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_data_updated_at
  BEFORE UPDATE ON api_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();