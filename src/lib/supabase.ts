import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'api-manager-app',
    }
  },
  db: {
    schema: 'public'
  },
  // Disable realtime to reduce connections
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Helper function to handle Supabase operations with retry logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.code === 'PGRST116' || error.status === 401 || error.status === 403) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_endpoints: {
        Row: {
          id: string;
          project_id: string | null;
          name: string;
          route: string;
          json_data: any;
          description: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          name: string;
          route: string;
          json_data?: any;
          description?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          name?: string;
          route?: string;
          json_data?: any;
          description?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};