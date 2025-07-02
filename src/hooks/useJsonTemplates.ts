import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { directApi } from '../lib/directApi';

export interface JsonTemplate {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  json_data: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useJsonTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<JsonTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('json_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching JSON templates:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadTemplates = async () => {
      if (mounted) {
        await fetchTemplates();
      }
    };

    timeoutId = setTimeout(() => {
      if (mounted) {
        loadTemplates();
      }
    }, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchTemplates]);

  const addTemplate = async (template: Omit<JsonTemplate, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('json_templates')
        .insert([{ ...template, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setTemplates(prev => [data, ...prev]);
      
      // Clear directApi cache for any APIs using this template
      directApi.clearCache();
      
      return data;
    } catch (error) {
      console.error('Error adding JSON template:', error);
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<JsonTemplate>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('json_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === id ? data : t));
      
      // Clear directApi cache for any APIs using this template
      directApi.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error updating JSON template:', error);
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('json_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      
      // Clear directApi cache for any APIs using this template
      directApi.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error deleting JSON template:', error);
      return false;
    }
  };

  const getTemplatesByProjectId = (projectId: string) => {
    return templates.filter(template => template.project_id === projectId);
  };

  return {
    templates,
    loading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByProjectId,
    refetch: fetchTemplates,
  };
};