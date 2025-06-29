-- Fix infinite recursion in teams and team_members policies

-- Drop problematic policies
DROP POLICY IF EXISTS "Team owners and admins can update teams" ON teams;
DROP POLICY IF EXISTS "Users can read teams they belong to" ON teams;
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can read team members of their teams" ON team_members;

-- Create a helper function to safely get team IDs without triggering recursive RLS
CREATE OR REPLACE FUNCTION user_team_ids(user_uuid uuid)
RETURNS TABLE(team_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = user_uuid
    AND tm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create non-recursive policies for teams table
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT team_id FROM user_team_ids(auth.uid()))
  );

-- Create non-recursive policies for team members
CREATE POLICY "Users can read team members for their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM user_team_ids(auth.uid()))
    OR user_id = auth.uid()
  );

-- Add optimized index for team membership lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_active 
ON team_members(user_id, status) 
WHERE status = 'active';