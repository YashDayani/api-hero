import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ApiEndpoint {
  id: string;
  project_id: string;
  name: string;
  route: string;
  json_data: any;
  description?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  api_key?: string;
  requires_auth: boolean;
  data_type?: 'template' | 'schema';
  schema_id?: string;
  template_id?: string;
}

export const useApis = () => {
  const { user } = useAuth();
  const [apis, setApis] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApis = useCallback(async () => {
    if (!user) {
      setApis([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const { data, error: fetchError } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error fetching APIs:', fetchError);
        setError(`Failed to load APIs: ${fetchError.message}`);
        setApis([]);
      } else {
        setApis(data || []);
        setError(null);
      }
    } catch (error) {
      console.error('Network error fetching APIs:', error);
      setError('Network error: Unable to connect to the server. Please check your internet connection and try again.');
      setApis([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const loadApis = async () => {
      if (user && mounted) {
        await fetchApis();
      } else if (!user && mounted) {
        setApis([]);
        setLoading(false);
        setError(null);
      }
    };

    // Debounce the initial load
    timeoutId = setTimeout(() => {
      if (mounted) {
        loadApis();
      }
    }, 100);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, fetchApis]);

  const generateApiKey = () => {
    return 'ak_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const addApi = async (api: Omit<ApiEndpoint, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      let jsonData = api.json_data;
      let apiKey = api.api_key;

      // Generate API key if not public and no key provided
      if (!api.is_public && !apiKey) {
        apiKey = generateApiKey();
      } else if (api.is_public) {
        apiKey = undefined; // Clear API key for public endpoints
      }

      // Clean up the data before sending to database
      const cleanedApi = {
        project_id: api.project_id,
        name: api.name,
        route: api.route,
        json_data: jsonData,
        description: api.description || '',
        is_public: api.is_public,
        requires_auth: api.requires_auth,
        data_type: api.data_type || 'template',
        user_id: user.id,
        api_key: apiKey,
        // Only include schema_id if it's not empty and data_type is 'schema'
        ...(api.data_type === 'schema' && api.schema_id ? { schema_id: api.schema_id } : {}),
        // Only include template_id if it's not empty and data_type is 'template'
        ...(api.data_type === 'template' && api.template_id ? { template_id: api.template_id } : {})
      };

      const { data, error } = await supabase
        .from('api_endpoints')
        .insert([cleanedApi])
        .select()
        .single();

      if (error) {
        console.error('Error adding API:', error);
        return null;
      }
      
      setApis(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Network error adding API:', error);
      return null;
    }
  };

  const updateApi = async (id: string, updates: Partial<ApiEndpoint>) => {
    if (!user) return false;

    try {
      // Preserve existing API key unless explicitly changing access type
      const currentApi = apis.find(api => api.id === id);
      let finalUpdates = { ...updates };

      // Handle API key logic based on access type changes
      if (updates.is_public !== undefined) {
        if (updates.is_public === true) {
          // Switching to public - clear API key
          finalUpdates.api_key = null;
        } else if (updates.is_public === false) {
          // Switching to private - preserve existing key or generate new one
          if (!currentApi?.api_key && !updates.api_key) {
            finalUpdates.api_key = generateApiKey();
          }
          // If api_key is provided in updates, use it; otherwise preserve existing
        }
      }

      // Clean up schema_id and template_id based on data_type
      if (updates.data_type !== 'schema') {
        finalUpdates.schema_id = null;
      }
      if (updates.data_type !== 'template') {
        finalUpdates.template_id = null;
      }

      const { data, error } = await supabase
        .from('api_endpoints')
        .update(finalUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating API:', error);
        return false;
      }

      setApis(prev => prev.map(a => a.id === id ? data : a));
      return true;
    } catch (error) {
      console.error('Network error updating API:', error);
      return false;
    }
  };

  const regenerateApiKey = async (id: string) => {
    if (!user) return false;

    try {
      const newApiKey = generateApiKey();
      
      const { data, error } = await supabase
        .from('api_endpoints')
        .update({ api_key: newApiKey })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error regenerating API key:', error);
        return false;
      }

      setApis(prev => prev.map(a => a.id === id ? data : a));
      return true;
    } catch (error) {
      console.error('Network error regenerating API key:', error);
      return false;
    }
  };

  const deleteApi = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('api_endpoints')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting API:', error);
        return false;
      }

      setApis(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (error) {
      console.error('Network error deleting API:', error);
      return false;
    }
  };

  const getApisByProjectId = (projectId: string) => {
    return apis.filter(api => api.project_id === projectId);
  };

  const getApiByRoute = async (route: string) => {
    try {
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('route', route)
        .single();

      if (error) {
        console.error('Error fetching API by route:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Network error fetching API by route:', error);
      return null;
    }
  };

  const retryFetch = useCallback(() => {
    fetchApis();
  }, [fetchApis]);

  return {
    apis,
    loading,
    error,
    addApi,
    updateApi,
    deleteApi,
    regenerateApiKey,
    getApisByProjectId,
    getApiByRoute,
    refetch: fetchApis,
    retryFetch,
  };
};