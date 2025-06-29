import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Team {
  id: string;
  name: string;
  description: string;
  is_personal: boolean;
  settings: any;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
  status: 'active' | 'inactive' | 'pending';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  message: string;
  invitation_token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  invited_by: string;
  accepted_by?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  inviter?: {
    email: string;
    full_name?: string;
  };
}

export interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  project_id?: string;
  team_id?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  details: any;
  changes: any;
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  content_type: 'text' | 'markdown';
  entity_type: 'project' | 'api_endpoint' | 'schema' | 'template';
  entity_id: string;
  project_id?: string;
  team_id?: string;
  parent_id?: string;
  thread_level: number;
  user_id: string;
  user_name: string;
  user_email: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  reactions: any;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all teams where user is the owner (direct query to avoid recursion)
      const { data: ownedTeams, error: ownedError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get all team IDs where user is a member (direct query to avoid recursion)
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) throw membershipError;

      // If user has memberships, get those teams
      let teamData: Team[] = ownedTeams || [];
      
      if (memberships && memberships.length > 0) {
        const teamIds = memberships.map(m => m.team_id);
        const { data: memberTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds)
          .not('owner_id', 'eq', user.id); // Exclude owned teams to avoid duplicates
        
        if (teamsError) throw teamsError;
        
        if (memberTeams) {
          teamData = [...teamData, ...memberTeams];
        }
      }

      // Sort by creation date
      teamData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTeams(teamData);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async (teamData: { name: string; description: string }) => {
    if (!user) return null;

    try {
      // First create the team
      const { data, error } = await supabase
        .from('teams')
        .insert([{ ...teamData, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Then add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: data.id,
          user_id: user.id,
          role: 'owner',
          status: 'active'
        }]);

      if (memberError) {
        console.error('Error adding team member:', memberError);
        // Don't throw here as team was created successfully
      }

      // Refresh the teams list
      await fetchTeams();
      return data;
    } catch (err: any) {
      console.error('Error creating team:', err);
      return null;
    }
  };

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (err: any) {
      console.error('Error updating team:', err);
      return false;
    }
  };

  const deleteTeam = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (err: any) {
      console.error('Error deleting team:', err);
      return false;
    }
  };

  const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    if (!user) return [];

    try {
      // First get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        return [];
      }

      // Then get user details for those members
      const userIds = members.map(m => m.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Combine the data
      const enrichedMembers = members.map(member => {
        const userData = users?.find(u => u.id === member.user_id);
        return {
          ...member,
          user: userData ? {
            email: userData.email,
            full_name: userData.raw_user_meta_data?.full_name
          } : undefined
        };
      });

      return enrichedMembers;
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      return [];
    }
  };

  const inviteTeamMember = async (teamId: string, email: string, role: 'admin' | 'editor' | 'viewer', message?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          team_id: teamId,
          email,
          role,
          message: message || '',
          invited_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data;
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      return null;
    }
  };

  const updateMemberRole = async (teamId: string, userId: string, role: 'admin' | 'editor' | 'viewer') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (err: any) {
      console.error('Error updating member role:', err);
      return false;
    }
  };

  const removeMember = async (teamId: string, userId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (err: any) {
      console.error('Error removing member:', err);
      return false;
    }
  };

  const getActivityFeed = async (teamId?: string, projectId?: string, limit: number = 50): Promise<ActivityEntry[]> => {
    if (!user) return [];

    try {
      let query = supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (err: any) {
      console.error('Error fetching activity feed:', err);
      return [];
    }
  };

  const addComment = async (
    entityType: 'project' | 'api_endpoint' | 'schema' | 'template',
    entityId: string,
    content: string,
    projectId?: string,
    teamId?: string,
    parentId?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{
          content,
          entity_type: entityType,
          entity_id: entityId,
          project_id: projectId,
          team_id: teamId,
          parent_id: parentId,
          thread_level: parentId ? 1 : 0,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          user_email: user.email
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      return null;
    }
  };

  const getComments = async (
    entityType: 'project' | 'api_endpoint' | 'schema' | 'template',
    entityId: string
  ): Promise<Comment[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group comments by thread
      const comments = data || [];
      const threaded = comments.filter(c => !c.parent_id);
      
      threaded.forEach(comment => {
        comment.replies = comments.filter(c => c.parent_id === comment.id);
      });

      return threaded;
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      return [];
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean = true) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_resolved: resolved,
          resolved_by: resolved ? user.id : null,
          resolved_at: resolved ? new Date().toISOString() : null
        })
        .eq('id', commentId);

      if (error) throw error;

      return true;
    } catch (err: any) {
      console.error('Error resolving comment:', err);
      return false;
    }
  };

  return {
    teams,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeamMembers,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
    getActivityFeed,
    addComment,
    getComments,
    resolveComment,
    refetch: fetchTeams
  };
};