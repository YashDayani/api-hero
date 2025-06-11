/*
  # Smart Cache Invalidation System

  1. Database Functions
    - Create function to notify cache invalidation
    - Add triggers to automatically invalidate cache on data changes

  2. Triggers
    - api_endpoints table changes
    - json_templates table changes  
    - api_schemas table changes
    - api_data table changes

  3. Performance
    - Lightweight triggers that only fire on actual changes
    - Efficient notification system for cache invalidation
*/

-- Create a function to handle cache invalidation notifications
CREATE OR REPLACE FUNCTION notify_cache_invalidation()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by triggers when data changes
  -- The edge function will check timestamps to determine if cache is stale
  
  -- For api_endpoints changes
  IF TG_TABLE_NAME = 'api_endpoints' THEN
    -- Update the updated_at timestamp (already handled by existing trigger)
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For json_templates changes
  IF TG_TABLE_NAME = 'json_templates' THEN
    -- Update any api_endpoints that use this template
    UPDATE api_endpoints 
    SET updated_at = now() 
    WHERE template_id = COALESCE(NEW.id, OLD.id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For api_schemas changes
  IF TG_TABLE_NAME = 'api_schemas' THEN
    -- Update any api_endpoints that use this schema
    UPDATE api_endpoints 
    SET updated_at = now() 
    WHERE schema_id = COALESCE(NEW.id, OLD.id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- For api_data changes
  IF TG_TABLE_NAME = 'api_data' THEN
    -- Update any api_endpoints that use this schema
    UPDATE api_endpoints 
    SET updated_at = now() 
    WHERE schema_id = COALESCE(NEW.schema_id, OLD.schema_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for cache invalidation

-- Trigger for json_templates changes
DROP TRIGGER IF EXISTS cache_invalidation_json_templates ON json_templates;
CREATE TRIGGER cache_invalidation_json_templates
  AFTER INSERT OR UPDATE OR DELETE ON json_templates
  FOR EACH ROW
  EXECUTE FUNCTION notify_cache_invalidation();

-- Trigger for api_schemas changes  
DROP TRIGGER IF EXISTS cache_invalidation_api_schemas ON api_schemas;
CREATE TRIGGER cache_invalidation_api_schemas
  AFTER INSERT OR UPDATE OR DELETE ON api_schemas
  FOR EACH ROW
  EXECUTE FUNCTION notify_cache_invalidation();

-- Trigger for api_data changes
DROP TRIGGER IF EXISTS cache_invalidation_api_data ON api_data;
CREATE TRIGGER cache_invalidation_api_data
  AFTER INSERT OR UPDATE OR DELETE ON api_data
  FOR EACH ROW
  EXECUTE FUNCTION notify_cache_invalidation();

-- Add indexes to optimize the cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_api_endpoints_template_invalidation 
ON api_endpoints(template_id, updated_at) 
WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_endpoints_schema_invalidation 
ON api_endpoints(schema_id, updated_at) 
WHERE schema_id IS NOT NULL;

-- Optimize the updated_at queries
CREATE INDEX IF NOT EXISTS idx_api_endpoints_updated_at ON api_endpoints(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_json_templates_updated_at ON json_templates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_schemas_updated_at ON api_schemas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_data_updated_at ON api_data(updated_at DESC);