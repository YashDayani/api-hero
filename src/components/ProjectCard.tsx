import React, { useState } from 'react';
import { Project } from '../hooks/useProjects';
import { Edit2, Trash2, FolderOpen, Calendar, Code, AlertTriangle } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  apiCount: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onOpen: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  apiCount,
  onEdit,
  onDelete,
  onOpen,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(project.id);
    setShowDeleteConfirm(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
            </div>
            
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{project.description}</p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Code className="w-3 h-3" />
                <span>{apiCount} API{apiCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Created {formatDate(project.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onOpen(project)}
            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open</span>
          </button>
          
          <button
            onClick={() => onEdit(project)}
            className="flex items-center justify-center bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Delete Project</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{project.name}"</span>?
              </p>
              
              {apiCount > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Warning:</p>
                      <p>This will also permanently delete all {apiCount} API{apiCount !== 1 ? 's' : ''} in this project.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All project data, including API endpoints and configurations, will be permanently removed.
              </p>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};