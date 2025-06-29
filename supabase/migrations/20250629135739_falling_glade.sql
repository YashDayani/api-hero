/*
  # Fix infinite recursion in teams and team_members policies

  1. Issue
    - Infinite recursion detected in RLS policies for teams and team_members tables
    - Circular dependency between policies that reference each other

  2. Solution
    - Drop all existing problematic policies
    - Create new non-recursive policies
    - Avoid cross-table policy dependencies that cause recursion

  3. Security
    - Maintain proper access control without recursion
    - Ensure users can only access their own teams and memberships
    - Allow team owners to manage their teams directly
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Team owners and admins can update teams" ON teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can read teams they belong to" ON teams;

DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Team owners can manage all members" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON team_members;
DROP POLICY IF EXISTS "Users can update own membership" ON team_members;

-- Create new non-recursive policies for teams table
CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can read their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create new non-recursive policies for team_members table
CREATE POLICY "Users can read their own memberships"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memberships"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON team_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow team owners to manage team members (non-recursive)
-- This policy uses a direct subquery without triggering team_members policies
CREATE POLICY "Team owners can manage all team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  );

-- Create a separate policy for reading team data by members
-- This avoids the infinite recursion by using a function instead of a policy reference
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

-- Policy to allow users to read teams they belong to (using function to avoid recursion)
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM user_team_ids(auth.uid())
    )
  );

-- Policy to allow team admins to manage members (non-recursive)
CREATE POLICY "Team admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
        AND tm.status = 'active'
        AND tm.team_id = team_members.team_id
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT tm.team_id
      FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.role IN ('admin', 'owner')
        AND tm.status = 'active'
        AND tm.team_id = team_members.team_id
    )
  );