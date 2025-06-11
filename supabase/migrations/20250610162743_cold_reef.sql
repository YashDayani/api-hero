/*
  # Add JSON Templates Support

  1. New Tables
    - `json_templates` - Store reusable JSON templates for API endpoints

  2. Schema Changes
    - Add `template_id` to api_endpoints table to reference JSON templates

  3. Security
    - Enable RLS on json_templates table
    - Add policies for user access control
*/

-- Create json_templates table
CREATE TABLE IF NOT EXISTS json_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  json_data jsonb NOT NULL DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add template support to api_endpoints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_endpoints' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE api_endpoints ADD COLUMN template_id uuid REFERENCES json_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE json_templates ENABLE ROW LEVEL SECURITY;

-- Policies for json_templates
CREATE POLICY "Users can read own templates"
  ON json_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON json_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON json_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON json_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_json_templates_project_id ON json_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_json_templates_user_id ON json_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoints_template_id ON api_endpoints(template_id);

-- Add trigger for updated_at
CREATE TRIGGER update_json_templates_updated_at
  BEFORE UPDATE ON json_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();