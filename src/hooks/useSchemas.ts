import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface SchemaField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'textarea' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  arrayItemType?: 'text' | 'number' | 'url' | 'object';
  objectFields?: SchemaField[];
}

export interface ApiSchema {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  fields: SchemaField[];
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDataEntry {
  id: string;
  schema_id: string;
  data: Record<string, any>;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSchemas = () => {
  const { user } = useAuth();
  const [schemas, setSchemas] = useState<ApiSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchemas = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('api_schemas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchemas(data || []);
    } catch (error) {
      console.error('Error fetching schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSchemas();
    } else {
      setSchemas([]);
      setLoading(false);
    }
  }, [user]);

  const addSchema = async (schema: Omit<ApiSchema, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('api_schemas')
        .insert([{ ...schema, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setSchemas(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding schema:', error);
      return null;
    }
  };

  const updateSchema = async (id: string, updates: Partial<ApiSchema>) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('api_schemas')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSchemas(prev => prev.map(s => s.id === id ? data : s));
      return true;
    } catch (error) {
      console.error('Error updating schema:', error);
      return false;
    }
  };

  const deleteSchema = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('api_schemas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSchemas(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting schema:', error);
      return false;
    }
  };

  const getSchemasByProjectId = (projectId: string) => {
    return schemas.filter(schema => schema.project_id === projectId);
  };

  // Data management functions
  const addDataEntry = async (schemaId: string, data: Record<string, any>) => {
    if (!user) {
      console.error('No user found for adding data entry');
      return null;
    }

    try {
      console.log('Adding data entry for schema:', schemaId, 'with data:', data);
      
      const { data: entry, error } = await supabase
        .from('api_data')
        .insert([{ schema_id: schemaId, data, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding data entry:', error);
        throw error;
      }
      
      console.log('Successfully added data entry:', entry);
      return entry;
    } catch (error) {
      console.error('Error adding data entry:', error);
      return null;
    }
  };

  const updateDataEntry = async (id: string, data: Record<string, any>) => {
    if (!user) {
      console.error('No user found for updating data entry');
      return false;
    }

    try {
      console.log('Updating data entry:', id, 'with data:', data);
      
      const { error } = await supabase
        .from('api_data')
        .update({ data })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error updating data entry:', error);
        throw error;
      }
      
      console.log('Successfully updated data entry');
      return true;
    } catch (error) {
      console.error('Error updating data entry:', error);
      return false;
    }
  };

  const deleteDataEntry = async (id: string) => {
    if (!user) {
      console.error('No user found for deleting data entry');
      return false;
    }

    try {
      console.log('Deleting data entry:', id);
      
      const { error } = await supabase
        .from('api_data')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting data entry:', error);
        throw error;
      }
      
      console.log('Successfully deleted data entry');
      return true;
    } catch (error) {
      console.error('Error deleting data entry:', error);
      return false;
    }
  };

  const getDataBySchemaId = async (schemaId: string, currentUser?: any): Promise<ApiDataEntry[]> => {
    const userToUse = currentUser || user;
    
    if (!userToUse) {
      console.error('No user found for fetching data entries');
      return [];
    }

    try {
      console.log('Fetching data entries for schema:', schemaId, 'and user:', userToUse.id);
      
      const { data, error } = await supabase
        .from('api_data')
        .select('*')
        .eq('schema_id', schemaId)
        .eq('user_id', userToUse.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching data entries:', error);
        throw error;
      }
      
      console.log('Successfully fetched data entries:', data);
      return data || [];
    } catch (error) {
      console.error('Error fetching data entries:', error);
      return [];
    }
  };

  return {
    schemas,
    loading,
    addSchema,
    updateSchema,
    deleteSchema,
    getSchemasByProjectId,
    addDataEntry,
    updateDataEntry,
    deleteDataEntry,
    getDataBySchemaId,
    refetch: fetchSchemas,
  };
};