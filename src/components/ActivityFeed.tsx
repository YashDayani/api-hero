import React, { useState, useEffect } from 'react';
import { useTeams, ActivityEntry } from '../hooks/useTeams';
import { Activity, User, Database, Code, FolderOpen, Calendar, Filter, RefreshCw } from 'lucide-react';

interface ActivityFeedProps {
  projectId?: string;
  teamId?: string;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  teamId,
  limit = 50
}) => {
  const { getActivityFeed } = useTeams();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();
  }, [projectId, teamId, limit]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivityFeed(teamId, projectId, limit);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string, entityType: string) => {
    switch (entityType) {
      case 'project':
        return <FolderOpen className="w-4 h-4" />;
      case 'api_endpoint':
        return <Code className="w-4 h-4" />;
      case 'schema':
      case 'template':
        return <Database className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'updated':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'deleted':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'shared':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const formatActionText = (activity: ActivityEntry) => {
    const { action, entity_type, entity_name } = activity;
    const entityTypeLabel = entity_type.replace('_', ' ');
    
    switch (action) {
      case 'created':
        return `created ${entityTypeLabel} "${entity_name}"`;
      case 'updated':
        return `updated ${entityTypeLabel} "${entity_name}"`;
      case 'deleted':
        return `deleted ${entityTypeLabel} "${entity_name}"`;
      case 'shared':
        return `shared ${entityTypeLabel} "${entity_name}"`;
      default:
        return `${action} ${entityTypeLabel} "${entity_name}"`;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.action === filter || activity.entity_type === filter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Feed</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({filteredActivities.length} activities)
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="project">Projects</option>
            <option value="api_endpoint">API Endpoints</option>
            <option value="schema">Schemas</option>
            <option value="template">Templates</option>
          </select>
          
          <button
            onClick={loadActivities}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh activities"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.action)}`}>
                {getActivityIcon(activity.action, activity.entity_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{activity.user_name}</span>
                      {' '}
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatActionText(activity)}
                      </span>
                    </p>
                    
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {activity.details.description && (
                          <p>{activity.details.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 ml-4">
                    <Calendar className="w-3 h-3" />
                    <span>{getTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
                
                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{activity.user_email}</span>
                  </span>
                  
                  <span className="capitalize">
                    {activity.entity_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
            <p className="text-sm">
              {filter === 'all' 
                ? 'No activities to show yet. Start creating and editing to see activity here.'
                : `No ${filter} activities found. Try changing the filter.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length >= limit && (
        <div className="text-center pt-4">
          <button
            onClick={() => loadActivities()}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            Load more activities
          </button>
        </div>
      )}
    </div>
  );
};