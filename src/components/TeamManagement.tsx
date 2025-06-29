import React, { useState, useEffect } from 'react';
import { useTeams, Team, TeamMember } from '../hooks/useTeams';
import { Users, Plus, Settings, UserPlus, Crown, Shield, Edit, Eye, X, Mail, Send, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamManagementProps {
  onClose: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ onClose }) => {
  const { teams, loading, createTeam, updateTeam, deleteTeam, getTeamMembers, inviteTeamMember, updateMemberRole, removeMember } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: ''
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
    message: ''
  });

  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers();
    }
  }, [selectedTeam]);

  const loadTeamMembers = async () => {
    if (!selectedTeam) return;
    
    setLoadingMembers(true);
    try {
      const members = await getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    const team = await createTeam(teamForm);
    if (team) {
      toast.success('Team created successfully!');
      setShowCreateTeam(false);
      setTeamForm({ name: '', description: '' });
      setSelectedTeam(team);
    } else {
      toast.error('Failed to create team');
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteForm.email.trim()) {
      toast.error('Email is required');
      return;
    }

    const invitation = await inviteTeamMember(selectedTeam.id, inviteForm.email, inviteForm.role, inviteForm.message);
    if (invitation) {
      toast.success('Invitation sent successfully!');
      setShowInviteMember(false);
      setInviteForm({ email: '', role: 'viewer', message: '' });
      loadTeamMembers();
    } else {
      toast.error('Failed to send invitation');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!selectedTeam) return;

    const success = await updateMemberRole(selectedTeam.id, userId, newRole);
    if (success) {
      toast.success('Member role updated successfully!');
      loadTeamMembers();
    } else {
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;

    if (confirm('Are you sure you want to remove this member from the team?')) {
      const success = await removeMember(selectedTeam.id, userId);
      if (success) {
        toast.success('Member removed successfully!');
        loadTeamMembers();
      } else {
        toast.error('Failed to remove member');
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage teams, members, and collaboration
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Teams List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Teams</h3>
                <button
                  onClick={() => setShowCreateTeam(true)}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Team</span>
                </button>
              </div>

              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {team.name}
                          </h4>
                          {team.is_personal && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs">
                              Personal
                            </span>
                          )}
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Details */}
            <div className="lg:col-span-2 space-y-6">
              {selectedTeam ? (
                <>
                  {/* Team Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                          {selectedTeam.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {selectedTeam.name}
                            </h3>
                            {selectedTeam.is_personal && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-sm">
                                Personal
                              </span>
                            )}
                          </div>
                          {selectedTeam.description && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {selectedTeam.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Created {new Date(selectedTeam.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!selectedTeam.is_personal && (
                          <button
                            onClick={() => setShowInviteMember(true)}
                            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Invite</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Team Members ({teamMembers.length})
                      </h4>
                    </div>

                    <div className="p-6">
                      {loadingMembers ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : teamMembers.length > 0 ? (
                        <div className="space-y-4">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                                  {(member.user?.full_name || member.user?.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-medium text-gray-900 dark:text-white">
                                      {member.user?.full_name || member.user?.email?.split('@')[0] || 'Unknown User'}
                                    </h5>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getRoleColor(member.role)}`}>
                                      {getRoleIcon(member.role)}
                                      <span className="capitalize">{member.role}</span>
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {member.user?.email}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Joined {new Date(member.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {!selectedTeam.is_personal && member.role !== 'owner' && (
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                  </select>
                                  <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                                    title="Remove member"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No team members yet</p>
                          {!selectedTeam.is_personal && (
                            <button
                              onClick={() => setShowInviteMember(true)}
                              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Invite your first member
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
                  <p>Select a team from the list to view its details and members</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Team</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter team name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={teamForm.description}
                    onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional team description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Team
                </button>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Team Member</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="viewer">Viewer - Can view projects and APIs</option>
                    <option value="editor">Editor - Can edit projects and APIs</option>
                    <option value="admin">Admin - Can manage team and members</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Personal Message
                  </label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Optional invitation message"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
                <button
                  onClick={handleInviteMember}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </button>
                <button
                  onClick={() => setShowInviteMember(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};