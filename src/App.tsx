import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import { Project } from './hooks/useProjects';
import { AuthForm } from './components/AuthForm';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Ensure dark mode is applied on initial load
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
  };

  const handleBackToProjects = () => {
    setCurrentProject(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#374151' : '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {!user ? (
        <AuthForm />
      ) : currentProject ? (
        <ProjectDetailView
          project={currentProject}
          onBack={handleBackToProjects}
        />
      ) : (
        <ProjectsView onOpenProject={handleOpenProject} />
      )}
    </>
  );
}

export default App;