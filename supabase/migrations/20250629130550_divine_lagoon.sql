/*
  # Team Collaboration System

  1. New Tables
    - `teams` - Store team information
    - `team_members` - Store team membership and roles
    - `team_invitations` - Store pending team invitations
    - `activity_feed` - Store activity/audit log
    - `comments` - Store comments on APIs and schemas

  2. Collaboration Features
    - Team management with role-based permissions
    - Invitation system for team members
    - Activity feed for tracking changes
    - Comments system for APIs and schemas

  3. Security
    - Enable RLS on all collaboration tables
    - Add policies for team-based access control
    - Ensure proper permission inheritance
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  
  -- Team settings
  is_personal boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  
  -- Owner and creation
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table for role-based access
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role text CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) DEFAULT 'viewer',
  permissions jsonb DEFAULT '[]',
  
  -- Status
  status text CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
  
  -- Invitation details
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique user per team
  UNIQUE(team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Invitation details
  email text NOT NULL,
  role text CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  message text DEFAULT '',
  
  -- Token for invitation link
  invitation_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  
  -- Status and timing
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  
  -- Creator and recipient
  invited_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_feed table for audit log
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activity details
  action text NOT NULL, -- 'created', 'updated', 'deleted', 'shared', etc.
  entity_type text NOT NULL, -- 'project', 'api_endpoint', 'schema', 'template', etc.
  entity_id uuid NOT NULL,
  entity_name text,
  
  -- Context
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Actor and details
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  
  -- Additional data
  details jsonb DEFAULT '{}',
  changes jsonb DEFAULT '{}', -- before/after for updates
  
  -- Metadata
  ip_address inet,
  user_agent text,
  
  created_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Comment content
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text', 'markdown')),
  
  -- Target entity
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'api_endpoint', 'schema', 'template')),
  entity_id uuid NOT NULL,
  
  -- Context
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Threading
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  thread_level integer DEFAULT 0,
  
  -- Author
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  user_email text,
  
  -- Status
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  
  -- Reactions (emoji reactions)
  reactions jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_teams junction table to link projects with teams
CREATE TABLE IF NOT EXISTS project_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  
  -- Permission level for this team on this project
  permission_level text CHECK (permission_level IN ('read', 'write', 'admin')) DEFAULT 'read',
  
  -- Who added this team to the project
  added_by uuid REFERENCES auth.users(id),
  added_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  
  -- Ensure unique team per project
  UNIQUE(project_id, team_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;

-- Policies for teams
CREATE POLICY "Users can read teams they belong to"
  ON teams FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners and admins can update teams"
  ON teams FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND status = 'active'
    )
  );

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Policies for team_members
CREATE POLICY "Users can read team members of their teams"
  ON team_members FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Team admins can manage members"
  ON team_members FOR ALL TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND status = 'active'
    )
  );

-- Policies for team_invitations
CREATE POLICY "Users can read invitations they sent or received"
  ON team_invitations FOR SELECT TO authenticated
  USING (
    invited_by = auth.uid() 
    OR accepted_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND status = 'active'
    )
  );

CREATE POLICY "Team admins can manage invitations"
  ON team_invitations FOR ALL TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin') 
        AND status = 'active'
    )
  );

-- Policies for activity_feed
CREATE POLICY "Users can read activity from their teams and projects"
  ON activity_feed FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity entries"
  ON activity_feed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Users can read comments from their teams and projects"
  ON comments FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Policies for project_teams
CREATE POLICY "Users can read project team associations"
  ON project_teams FOR SELECT TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage project teams"
  ON project_teams FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email, status);

CREATE INDEX IF NOT EXISTS idx_activity_feed_team_created ON activity_feed(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_project_created ON activity_feed(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_entity ON activity_feed(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_team ON comments(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_project_teams_project ON project_teams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_teams_team ON project_teams(team_id);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create personal team for new users
CREATE OR REPLACE FUNCTION create_personal_team_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create personal team
  INSERT INTO teams (name, description, is_personal, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Team',
    'Personal workspace',
    true,
    NEW.id
  );
  
  -- Add user as owner of their personal team
  INSERT INTO team_members (team_id, user_id, role, status)
  SELECT id, NEW.id, 'owner', 'active'
  FROM teams 
  WHERE owner_id = NEW.id AND is_personal = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create personal teams
CREATE TRIGGER create_personal_team_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_team_for_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text,
  p_project_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
  user_data record;
BEGIN
  -- Get current user data
  SELECT 
    auth.uid() as id,
    COALESCE(auth.jwt()->>'email', '') as email,
    COALESCE(auth.jwt()->'user_metadata'->>'full_name', split_part(auth.jwt()->>'email', '@', 1)) as name
  INTO user_data;
  
  -- Insert activity record
  INSERT INTO activity_feed (
    action, entity_type, entity_id, entity_name,
    project_id, user_id, user_name, user_email, details
  )
  VALUES (
    p_action, p_entity_type, p_entity_id, p_entity_name,
    p_project_id, user_data.id, user_data.name, user_data.email, p_details
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;