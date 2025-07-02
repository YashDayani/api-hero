/*
  # Direct API Optimization - Public REST API Access

  1. New Views
    - `public_api_endpoints` - Public view for direct REST API access
    - `public_api_data` - Materialized view for schema-based data
  
  2. Security
    - Enable anonymous read access for public APIs
    - Maintain RLS for private APIs
  
  3. Performance
    - Materialized views for fast data access
    - Optimized indexes for REST API queries
    - Pre-computed JSON responses
*/

-- Create a public view that consolidates all API endpoint data for direct REST access
CREATE OR REPLACE VIEW public_api_endpoints AS
SELECT 
  e.id,
  e.route,
  e.name,
  e.description,
  e.is_public,
  e.data_type,
  -- For template-based endpoints, use template data
  CASE 
    WHEN e.data_type = 'template' AND t.json_data IS NOT NULL THEN t.json_data
    ELSE e.json_data
  END as response_data,
  -- Metadata for client optimization
  CASE 
    WHEN e.data_type = 'template' THEN COALESCE(t.updated_at, e.updated_at)
    ELSE e.updated_at
  END as last_modified,
  e.created_at,
  e.user_id,
  e.project_id
FROM api_endpoints e
LEFT JOIN json_templates t ON e.template_id = t.id
WHERE e.is_public = true;

-- Create materialized view for schema-based API data (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public_api_data AS
SELECT 
  e.id as endpoint_id,
  e.route,
  e.name,
  e.description,
  e.is_public,
  'schema' as data_type,
  -- Aggregate all data entries for this schema into a JSON array
  COALESCE(
    json_agg(d.data ORDER BY d.created_at DESC) FILTER (WHERE d.data IS NOT NULL),
    '[]'::json
  ) as response_data,
  -- Use the latest update time from either schema or data
  GREATEST(
    MAX(d.updated_at),
    MAX(s.updated_at),
    MAX(e.updated_at)
  ) as last_modified,
  e.created_at,
  e.user_id,
  e.project_id
FROM api_endpoints e
LEFT JOIN api_schemas s ON e.schema_id = s.id
LEFT JOIN api_data d ON e.schema_id = d.schema_id
WHERE e.is_public = true AND e.data_type = 'schema'
GROUP BY e.id, e.route, e.name, e.description, e.is_public, e.created_at, e.user_id, e.project_id;

-- Create unique index on materialized view for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_api_data_route ON public_api_data (route);
CREATE INDEX IF NOT EXISTS idx_public_api_data_endpoint_id ON public_api_data (endpoint_id);

-- Create indexes on main view for performance
CREATE INDEX IF NOT EXISTS idx_api_endpoints_public_route ON api_endpoints (route) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_api_endpoints_public_lookup ON api_endpoints (route, is_public, data_type) WHERE is_public = true;

-- Enable RLS on views (though they're public, good practice)
ALTER TABLE public_api_data ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to public API endpoints
CREATE POLICY "Allow anonymous read access to public APIs"
  ON api_endpoints FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Allow anonymous read access to public API data
CREATE POLICY "Allow anonymous read access to public API data"
  ON public_api_data FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anonymous read access to templates (needed for the view)
CREATE POLICY "Allow anonymous read access to public templates"
  ON json_templates FOR SELECT
  TO anon, authenticated
  USING (
    id IN (
      SELECT template_id 
      FROM api_endpoints 
      WHERE is_public = true AND template_id IS NOT NULL
    )
  );

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_public_api_data()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public_api_data;
  
  -- Update statistics for query planner
  ANALYZE public_api_data;
  ANALYZE public_api_endpoints;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view when data changes
CREATE OR REPLACE FUNCTION notify_api_data_refresh()
RETURNS trigger AS $$
BEGIN
  -- Use pg_notify to trigger background refresh
  PERFORM pg_notify('refresh_api_data', 'data_changed');
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic refresh
DROP TRIGGER IF EXISTS api_data_change_trigger ON api_data;
CREATE TRIGGER api_data_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON api_data
  FOR EACH ROW EXECUTE FUNCTION notify_api_data_refresh();

DROP TRIGGER IF EXISTS api_schemas_change_trigger ON api_schemas;
CREATE TRIGGER api_schemas_change_trigger
  AFTER UPDATE ON api_schemas
  FOR EACH ROW EXECUTE FUNCTION notify_api_data_refresh();

DROP TRIGGER IF EXISTS api_endpoints_schema_change_trigger ON api_endpoints;
CREATE TRIGGER api_endpoints_schema_change_trigger
  AFTER UPDATE OF schema_id, data_type, is_public ON api_endpoints
  FOR EACH ROW 
  WHEN (NEW.data_type = 'schema' AND NEW.is_public = true)
  EXECUTE FUNCTION notify_api_data_refresh();

-- Refresh the materialized view initially
SELECT refresh_public_api_data();