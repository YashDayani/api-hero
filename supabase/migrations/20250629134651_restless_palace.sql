/*
  # Create Analytics Tables and Fix Team Policies

  1. New Tables
    - `api_analytics` - detailed request/response data
    - `api_performance_metrics` - aggregated performance metrics  
    - `api_geographic_data` - geographic usage data

  2. Security
    - Enable RLS on all analytics tables
    - Add policies for user access control

  3. Performance
    - Add indexes for common query patterns
    - Add updated_at triggers

  4. Fix team_members infinite recursion
    - Remove problematic recursive policies
    - Add simpler non-recursive policies
*/

-- Create api_analytics table
CREATE TABLE IF NOT EXISTS api_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid,
  request_method text NOT NULL DEFAULT 'GET',
  request_path text NOT NULL,
  request_ip text,
  request_user_agent text,
  request_headers jsonb DEFAULT '{}'::jsonb,
  response_status integer NOT NULL,
  response_time_ms integer NOT NULL,
  response_size_bytes integer DEFAULT 0,
  country_code text,
  region text,
  city text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  error_message text,
  error_type text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create api_performance_metrics table
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid,
  period_type text NOT NULL CHECK (period_type IN ('hour', 'day', 'week', 'month')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_requests integer DEFAULT 0,
  successful_requests integer DEFAULT 0,
  failed_requests integer DEFAULT 0,
  avg_response_time_ms numeric DEFAULT 0,
  min_response_time_ms integer DEFAULT 0,
  max_response_time_ms integer DEFAULT 0,
  total_bytes_transferred bigint DEFAULT 0,
  error_4xx_count integer DEFAULT 0,
  error_5xx_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create api_geographic_data table
CREATE TABLE IF NOT EXISTS api_geographic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid,
  country_code text NOT NULL,
  country_name text,
  region text,
  city text,
  latitude numeric,
  longitude numeric,
  request_count integer DEFAULT 0,
  avg_response_time_ms numeric DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add foreign key constraints safely
DO $$
BEGIN
  -- api_analytics foreign keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_analytics' AND constraint_name = 'api_analytics_api_endpoint_id_fkey'
  ) THEN
    ALTER TABLE api_analytics ADD CONSTRAINT api_analytics_api_endpoint_id_fkey 
    FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_analytics' AND constraint_name = 'api_analytics_user_id_fkey'
  ) THEN
    ALTER TABLE api_analytics ADD CONSTRAINT api_analytics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_analytics' AND constraint_name = 'api_analytics_project_id_fkey'
  ) THEN
    ALTER TABLE api_analytics ADD CONSTRAINT api_analytics_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- api_performance_metrics foreign keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_performance_metrics' AND constraint_name = 'api_performance_metrics_api_endpoint_id_fkey'
  ) THEN
    ALTER TABLE api_performance_metrics ADD CONSTRAINT api_performance_metrics_api_endpoint_id_fkey 
    FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_performance_metrics' AND constraint_name = 'api_performance_metrics_user_id_fkey'
  ) THEN
    ALTER TABLE api_performance_metrics ADD CONSTRAINT api_performance_metrics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_performance_metrics' AND constraint_name = 'api_performance_metrics_project_id_fkey'
  ) THEN
    ALTER TABLE api_performance_metrics ADD CONSTRAINT api_performance_metrics_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- api_geographic_data foreign keys
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_geographic_data' AND constraint_name = 'api_geographic_data_api_endpoint_id_fkey'
  ) THEN
    ALTER TABLE api_geographic_data ADD CONSTRAINT api_geographic_data_api_endpoint_id_fkey 
    FOREIGN KEY (api_endpoint_id) REFERENCES api_endpoints(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_geographic_data' AND constraint_name = 'api_geographic_data_user_id_fkey'
  ) THEN
    ALTER TABLE api_geographic_data ADD CONSTRAINT api_geographic_data_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'api_geographic_data' AND constraint_name = 'api_geographic_data_project_id_fkey'
  ) THEN
    ALTER TABLE api_geographic_data ADD CONSTRAINT api_geographic_data_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on analytics tables
ALTER TABLE api_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_geographic_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_analytics
DROP POLICY IF EXISTS "Users can view their own analytics" ON api_analytics;
CREATE POLICY "Users can view their own analytics"
  ON api_analytics FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert analytics" ON api_analytics;
CREATE POLICY "Service role can insert analytics"
  ON api_analytics FOR INSERT 
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON api_analytics;
CREATE POLICY "Authenticated users can insert analytics"
  ON api_analytics FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for api_performance_metrics
DROP POLICY IF EXISTS "Users can view their own performance metrics" ON api_performance_metrics;
CREATE POLICY "Users can view their own performance metrics"
  ON api_performance_metrics FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own performance metrics" ON api_performance_metrics;
CREATE POLICY "Users can manage their own performance metrics"
  ON api_performance_metrics FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for api_geographic_data
DROP POLICY IF EXISTS "Users can view their own geographic data" ON api_geographic_data;
CREATE POLICY "Users can view their own geographic data"
  ON api_geographic_data FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own geographic data" ON api_geographic_data;
CREATE POLICY "Users can manage their own geographic data"
  ON api_geographic_data FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_analytics_user_id ON api_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_api_analytics_api_endpoint_id ON api_analytics(api_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_api_analytics_project_id ON api_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_api_analytics_timestamp ON api_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_user_timestamp ON api_analytics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_endpoint_timestamp ON api_analytics(api_endpoint_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_project_timestamp ON api_analytics(project_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_user_id ON api_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_endpoint_period ON api_performance_metrics(api_endpoint_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_api_performance_metrics_project_period ON api_performance_metrics(project_id, period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_api_geographic_data_user_id ON api_geographic_data(user_id);
CREATE INDEX IF NOT EXISTS idx_api_geographic_data_endpoint_country ON api_geographic_data(api_endpoint_id, country_code);
CREATE INDEX IF NOT EXISTS idx_api_geographic_data_project_country ON api_geographic_data(project_id, country_code);

-- Fix team_members policies to prevent infinite recursion
-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Team owners can manage members" ON team_members;

-- Create a simpler, non-recursive policy for team owners
DROP POLICY IF EXISTS "Team owners can manage all members" ON team_members;
CREATE POLICY "Team owners can manage all members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

-- Add a policy for team admins to manage members (non-recursive)
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
CREATE POLICY "Team admins can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin' 
      AND tm.status = 'active'
      AND tm.team_id = team_members.team_id
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.role = 'admin' 
      AND tm.status = 'active'
      AND tm.team_id = team_members.team_id
    )
  );

-- Ensure updated_at function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for analytics tables
DROP TRIGGER IF EXISTS update_api_performance_metrics_updated_at ON api_performance_metrics;
CREATE TRIGGER update_api_performance_metrics_updated_at
  BEFORE UPDATE ON api_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_geographic_data_updated_at ON api_geographic_data;
CREATE TRIGGER update_api_geographic_data_updated_at
  BEFORE UPDATE ON api_geographic_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();