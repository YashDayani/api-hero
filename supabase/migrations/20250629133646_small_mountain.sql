/*
  # Fix team members RLS policies

  1. Security Changes
    - Drop existing recursive RLS policies on team_members table
    - Add simplified, non-recursive policies
    - Ensure policies don't reference themselves

  2. Policy Changes
    - Simple user-based SELECT policy
    - Owner/admin management policies that don't create circular references
    - Use direct user_id checks where possible
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Team admins can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can read team members of their teams" ON team_members;

-- Add simplified policies that don't cause recursion

-- Allow users to read their own team memberships
CREATE POLICY "Users can read own memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow team owners to manage all members in their teams
CREATE POLICY "Team owners can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = auth.uid()
    )
  );

-- Allow users to insert themselves into teams (for invitations)
CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own membership status
CREATE POLICY "Users can update own membership"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to leave teams (delete their own membership)
CREATE POLICY "Users can leave teams"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());