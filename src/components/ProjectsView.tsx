import React, { useState } from 'react';
import { useProjects, Project } from '../hooks/useProjects';
import { useApis } from '../hooks/useApis';
import { useAuth } from '../hooks/useAuth';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ProfileMenu } from './ProfileMenu';
import { Plus, FolderOpen, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectsViewProps {
  onOpenProject: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onOpenProject }) => {
  const { user } = useAuth();
  const { projects, loading, error, addProject, updateProject, deleteProject, retryFetch } = useProjects();
  const { getApisByProjectId } = useApis();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleCreateNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleSave = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    let success = false;
    
    if (editingProject) {
      success = await updateProject(editingProject.id, projectData);
      if (success) {
        toast.success('Project updated successfully!');
      } else {
        toast.error('Failed to update project. Please try again.');
      }
    } else {
      const newProject = await addProject(projectData);
      success = !!newProject;
      if (success) {
        toast.success('Project created successfully!');
      } else {
        toast.error('Failed to create project. Please try again.');
      }
    }
    
    if (success) {
      setShowForm(false);
      setEditingProject(null);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProject(id);
    if (success) {
      toast.success('Project deleted successfully!');
    } else {
      toast.error('Failed to delete project. Please try again.');
    }
  };

  const handleRetry = () => {
    retryFetch();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors relative">
          {/* Badge */}
          <div className="absolute top-4 right-4 z-10">
            <img 
              src="/white_circle_360x360.png" 
              alt="Powered by Bolt" 
              className="w-16 h-16 opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Hero</h1>
                </div>
              </div>
              <ProfileMenu />
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your projects...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors relative">
          {/* Badge */}
          <div className="absolute top-4 right-4 z-10">
            <img 
              src="/white_circle_360x360.png" 
              alt="Powered by Bolt" 
              className="w-16 h-16 opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Hero</h1>
                </div>
              </div>
              <ProfileMenu />
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Connection Error
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors relative">
        {/* Badge */}
        <div className="absolute top-4 right-4 z-10">
          <img 
            src="/white_circle_360x360.png" 
            alt="Powered by Bolt" 
            className="w-16 h-16 opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Hero</h1>
              </div>
              <div className="hidden sm:block">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {projects.length} project{projects.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleCreateNew}
                className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
              
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FolderOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Projects Yet
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Create your first project to organize and manage your API endpoints. 
                Each project can contain multiple GET APIs with custom JSON responses that will be accessible via live URLs.
              </p>
              
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Project</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                apiCount={getApisByProjectId(project.id).length}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpen={onOpenProject}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <ProjectForm
          project={editingProject || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};