/*
  # Performance Optimization for API Endpoints

  1. Database Optimizations
    - Add composite indexes for faster route lookups
    - Add partial indexes for common query patterns
    - Optimize existing indexes

  2. Query Performance
    - Create indexes for JOIN operations
    - Add indexes for ORDER BY operations
    - Optimize schema-based data queries
*/

-- Drop existing less optimal indexes
DROP INDEX IF EXISTS idx_api_endpoints_route;
DROP INDEX IF EXISTS idx_api_endpoints_route_public;
DROP INDEX IF EXISTS idx_api_endpoints_route_key;

-- Create optimized composite indexes for the most common query patterns
-- Index for public endpoint lookups (most common)
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_public_optimized 
ON api_endpoints(route, is_public) 
WHERE is_public = true;

-- Index for private endpoint lookups with API key
CREATE INDEX IF NOT EXISTS idx_api_endpoints_route_private_key 
ON api_endpoints(route, is_public, api_key) 
WHERE is_public = false AND api_key IS NOT NULL;

-- Index for template-based endpoints (for JOIN optimization)
CREATE INDEX IF NOT EXISTS idx_api_endpoints_template_lookup 
ON api_endpoints(template_id, route) 
WHERE template_id IS NOT NULL;

-- Index for schema-based endpoints
CREATE INDEX IF NOT EXISTS idx_api_endpoints_schema_lookup 
ON api_endpoints(schema_id, route) 
WHERE schema_id IS NOT NULL;

-- Optimize api_data queries for schema-based endpoints
CREATE INDEX IF NOT EXISTS idx_api_data_schema_created_optimized 
ON api_data(schema_id, created_at DESC);

-- Add covering index for json_templates to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_json_templates_covering 
ON json_templates(id) 
INCLUDE (json_data);

-- Optimize user-specific queries
CREATE INDEX IF NOT EXISTS idx_api_endpoints_user_project 
ON api_endpoints(user_id, project_id, created_at DESC);

-- Add statistics for better query planning
ANALYZE api_endpoints;
ANALYZE api_data;
ANALYZE json_templates;
ANALYZE projects;