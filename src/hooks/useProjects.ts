import { useState, useEffect, useCallback } from 'react';
import { supabase, withRetry } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Project {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await withRetry(async () => {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }
        
        return data || [];
      });

      setProjects(result);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      setError(
        error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INSUFFICIENT_RESOURCES')
          ? 'Network connection error. Please check your internet connection and try again.'
          : `Failed to load projects: ${error.message || 'Unknown error'}`
      );
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadProjects = async () => {
      if (mounted) {
        await fetchProjects();
      }
    };

    // Debounce the initial load to prevent rapid calls
    timeoutId = setTimeout(() => {
      if (mounted) {
        loadProjects();
      }
    }, 50);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('projects')
          .insert([{ ...project, user_id: user.id }])
          .select()
          .single();

        if (error) {
          throw error;
        }
        
        return data;
      });
      
      setProjects(prev => [result, ...prev]);
      return result;
    } catch (error: any) {
      console.error('Error adding project:', error);
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (!user) return false;

    try {
      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          throw error;
        }
        
        return data;
      });

      setProjects(prev => prev.map(p => p.id === id ? result : p));
      return true;
    } catch (error: any) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return false;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }
      });

      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const retryFetch = useCallback(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
    retryFetch,
  };
};