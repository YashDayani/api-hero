/*
  # Fix data_type constraint for API endpoints

  1. Schema Changes
    - Update data_type constraint to only allow 'template' and 'schema'
    - Set default data_type to 'template'
    - Update existing 'json' values to 'template'

  2. Migration Strategy
    - Temporarily disable the updated_at trigger to prevent interference
    - Update data in batches to avoid conflicts
    - Safely recreate the constraint
*/

-- Temporarily drop the updated_at trigger to prevent interference
DROP TRIGGER IF EXISTS update_api_endpoints_updated_at ON api_endpoints;

-- Drop the existing constraint first (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_endpoints_data_type_check'
      AND table_name = 'api_endpoints'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE api_endpoints DROP CONSTRAINT api_endpoints_data_type_check;
  END IF;
END $$;

-- Update all existing records to valid values without triggering updated_at
UPDATE api_endpoints 
SET data_type = CASE 
  WHEN data_type = 'json' OR data_type IS NULL THEN 'template'
  WHEN data_type = 'schema' THEN 'schema'
  ELSE 'template'
END
WHERE data_type IS NULL OR data_type NOT IN ('template', 'schema');

-- Set default data_type to 'template'
ALTER TABLE api_endpoints ALTER COLUMN data_type SET DEFAULT 'template';

-- Add the new constraint
ALTER TABLE api_endpoints ADD CONSTRAINT api_endpoints_data_type_check 
CHECK (data_type = ANY (ARRAY['template'::text, 'schema'::text]));

-- Recreate the updated_at trigger
CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify all existing data complies with the new constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM api_endpoints 
  WHERE data_type NOT IN ('template', 'schema') OR data_type IS NULL;
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % rows have invalid data_type values', invalid_count;
  END IF;
END $$;