/*
  # API Analytics System

  1. New Tables
    - `api_analytics` - Store API call metrics and performance data
    - `api_geographic_data` - Store geographic information about API calls
    - `api_performance_metrics` - Store detailed performance metrics

  2. Analytics Features
    - Track API calls, response times, error rates
    - Geographic analytics for API usage
    - Performance insights and trends
    - Real-time metrics collection

  3. Security
    - Enable RLS on all analytics tables
    - Add policies for user access control
    - Ensure data privacy and isolation
*/

-- Create api_analytics table for basic metrics
CREATE TABLE IF NOT EXISTS api_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Request details
  request_method text DEFAULT 'GET',
  request_path text NOT NULL,
  request_ip inet,
  request_user_agent text,
  request_headers jsonb DEFAULT '{}',
  
  -- Response details
  response_status integer NOT NULL,
  response_time_ms integer NOT NULL,
  response_size_bytes integer DEFAULT 0,
  
  -- Geographic data
  country_code varchar(2),
  region text,
  city text,
  
  -- Timing information
  timestamp timestamptz DEFAULT now(),
  date_only date GENERATED ALWAYS AS (timestamp::date) STORED,
  hour_only integer GENERATED ALWAYS AS (EXTRACT(hour FROM timestamp)) STORED,
  
  -- Error information
  error_message text,
  error_type text,
  
  created_at timestamptz DEFAULT now()
);

-- Create api_performance_metrics for aggregated performance data
CREATE TABLE IF NOT EXISTS api_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Time period (hourly, daily, weekly aggregations)
  period_type text CHECK (period_type IN ('hour', 'day', 'week', 'month')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  -- Aggregated metrics
  total_requests integer DEFAULT 0,
  successful_requests integer DEFAULT 0,
  failed_requests integer DEFAULT 0,
  avg_response_time_ms numeric(10,2) DEFAULT 0,
  min_response_time_ms integer DEFAULT 0,
  max_response_time_ms integer DEFAULT 0,
  total_bytes_transferred bigint DEFAULT 0,
  
  -- Error breakdown
  error_4xx_count integer DEFAULT 0,
  error_5xx_count integer DEFAULT 0,
  
  -- Top countries/regions
  top_countries jsonb DEFAULT '[]',
  top_user_agents jsonb DEFAULT '[]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique periods per endpoint
  UNIQUE(api_endpoint_id, period_type, period_start)
);

-- Create api_geographic_data for detailed geographic analytics
CREATE TABLE IF NOT EXISTS api_geographic_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint_id uuid REFERENCES api_endpoints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Geographic information
  country_code varchar(2) NOT NULL,
  country_name text,
  region text,
  city text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  
  -- Aggregated metrics per location
  request_count integer DEFAULT 1,
  avg_response_time_ms numeric(10,2) DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  
  -- Time tracking
  date_created date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique location per endpoint per day
  UNIQUE(api_endpoint_id, country_code, region, city, date_created)
);

-- Enable RLS
ALTER TABLE api_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_geographic_data ENABLE ROW LEVEL SECURITY;

-- Policies for api_analytics
CREATE POLICY "Users can read own analytics data"
  ON api_analytics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics data"
  ON api_analytics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert analytics (for edge function)
CREATE POLICY "Service role can insert analytics"
  ON api_analytics FOR INSERT TO service_role
  USING (true);

-- Policies for api_performance_metrics
CREATE POLICY "Users can read own performance metrics"
  ON api_performance_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own performance metrics"
  ON api_performance_metrics FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Policies for api_geographic_data
CREATE POLICY "Users can read own geographic data"
  ON api_geographic_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own geographic data"
  ON api_geographic_data FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_analytics_endpoint_timestamp ON api_analytics(api_endpoint_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_user_timestamp ON api_analytics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_project_timestamp ON api_analytics(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_analytics_date_hour ON api_analytics(date_only, hour_only);
CREATE INDEX IF NOT EXISTS idx_api_analytics_response_status ON api_analytics(response_status);
CREATE INDEX IF NOT EXISTS idx_api_analytics_country ON api_analytics(country_code);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint_period ON api_performance_metrics(api_endpoint_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_period ON api_performance_metrics(user_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_geographic_data_endpoint_date ON api_geographic_data(api_endpoint_id, date_created DESC);
CREATE INDEX IF NOT EXISTS idx_geographic_data_country ON api_geographic_data(country_code, request_count DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_api_performance_metrics_updated_at
  BEFORE UPDATE ON api_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_geographic_data_updated_at
  BEFORE UPDATE ON api_geographic_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to aggregate analytics data
CREATE OR REPLACE FUNCTION aggregate_analytics_data(
  target_endpoint_id uuid,
  target_period_type text,
  target_start timestamptz,
  target_end timestamptz
)
RETURNS void AS $$
DECLARE
  endpoint_user_id uuid;
  endpoint_project_id uuid;
BEGIN
  -- Get endpoint details
  SELECT user_id, project_id INTO endpoint_user_id, endpoint_project_id
  FROM api_endpoints WHERE id = target_endpoint_id;
  
  -- Insert or update performance metrics
  INSERT INTO api_performance_metrics (
    api_endpoint_id, user_id, project_id, period_type, period_start, period_end,
    total_requests, successful_requests, failed_requests,
    avg_response_time_ms, min_response_time_ms, max_response_time_ms,
    total_bytes_transferred, error_4xx_count, error_5xx_count
  )
  SELECT 
    target_endpoint_id,
    endpoint_user_id,
    endpoint_project_id,
    target_period_type,
    target_start,
    target_end,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 400) as successful_requests,
    COUNT(*) FILTER (WHERE response_status >= 400) as failed_requests,
    AVG(response_time_ms)::numeric(10,2) as avg_response_time_ms,
    MIN(response_time_ms) as min_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms,
    SUM(COALESCE(response_size_bytes, 0)) as total_bytes_transferred,
    COUNT(*) FILTER (WHERE response_status >= 400 AND response_status < 500) as error_4xx_count,
    COUNT(*) FILTER (WHERE response_status >= 500) as error_5xx_count
  FROM api_analytics
  WHERE api_endpoint_id = target_endpoint_id
    AND timestamp >= target_start
    AND timestamp < target_end
  ON CONFLICT (api_endpoint_id, period_type, period_start)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    min_response_time_ms = EXCLUDED.min_response_time_ms,
    max_response_time_ms = EXCLUDED.max_response_time_ms,
    total_bytes_transferred = EXCLUDED.total_bytes_transferred,
    error_4xx_count = EXCLUDED.error_4xx_count,
    error_5xx_count = EXCLUDED.error_5xx_count,
    updated_at = now();
    
END;
$$ LANGUAGE plpgsql;