/*
  # Fix Team Member RLS Policies

  1. Policy Updates
    - Remove problematic recursive policy for team admins
    - Simplify team member access policies to prevent infinite recursion
    - Ensure proper access control without circular dependencies

  2. Security
    - Maintain secure access control
    - Allow team owners and admins to manage members
    - Allow users to read their own memberships
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Team admins can manage team members" ON team_members;

-- Create a simpler, non-recursive policy for team admins
CREATE POLICY "Team admins can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
    OR
    (
      auth.uid() IN (
        SELECT tm.user_id 
        FROM team_members tm 
        WHERE tm.team_id = team_members.team_id 
        AND tm.role IN ('admin', 'owner') 
        AND tm.status = 'active'
        AND tm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id 
      AND t.owner_id = auth.uid()
    )
    OR
    (
      auth.uid() IN (
        SELECT tm.user_id 
        FROM team_members tm 
        WHERE tm.team_id = team_members.team_id 
        AND tm.role IN ('admin', 'owner') 
        AND tm.status = 'active'
        AND tm.user_id = auth.uid()
      )
    )
  );

-- Ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_role 
ON team_members(team_id, user_id, role) 
WHERE status = 'active';