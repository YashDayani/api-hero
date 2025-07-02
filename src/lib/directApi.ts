import { supabase } from './supabase';

export interface DirectApiResponse {
  id: string;
  route: string;
  name: string;
  description?: string;
  is_public: boolean;
  data_type: 'template' | 'schema';
  response_data: any;
  last_modified: string;
  created_at: string;
}

/**
 * Fetch API endpoint data directly from Supabase REST API
 * This bypasses the edge function for much faster response times (50-200ms vs 1.48-10s)
 */
export class DirectApiClient {
  private static instance: DirectApiClient;
  private cache = new Map<string, { data: DirectApiResponse; cachedAt: number }>();
  private readonly CACHE_TTL = 60 * 1000; // 1 minute client-side cache

  static getInstance(): DirectApiClient {
    if (!DirectApiClient.instance) {
      DirectApiClient.instance = new DirectApiClient();
    }
    return DirectApiClient.instance;
  }

  /**
   * Get public API endpoint by route with aggressive caching
   */
  async getPublicEndpoint(route: string): Promise<DirectApiResponse | null> {
    const cacheKey = `public:${route}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && (Date.now() - cached.cachedAt) < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const startTime = Date.now();
      
      // Try template-based endpoints first (faster query)
      let { data, error } = await supabase
        .from('public_api_endpoints')
        .select('*')
        .eq('route', route)
        .eq('data_type', 'template')
        .single();

      // If not found, try schema-based endpoints
      if (error?.code === 'PGRST116' || !data) {
        const schemaResult = await supabase
          .from('public_api_data')
          .select('*')
          .eq('route', route)
          .single();
        
        data = schemaResult.data;
        error = schemaResult.error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`Direct API fetch for ${route}: ${responseTime}ms`);

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      // Cache the successful response
      this.cache.set(cacheKey, {
        data: data as DirectApiResponse,
        cachedAt: Date.now()
      });

      return data as DirectApiResponse;
    } catch (error) {
      console.error('Direct API fetch error:', error);
      throw error;
    }
  }

  /**
   * Prefetch multiple endpoints for better UX
   */
  async prefetchEndpoints(routes: string[]): Promise<void> {
    const uncachedRoutes = routes.filter(route => {
      const cached = this.cache.get(`public:${route}`);
      return !cached || (Date.now() - cached.cachedAt) >= this.CACHE_TTL;
    });

    if (uncachedRoutes.length === 0) return;

    try {
      // Batch fetch template-based endpoints
      const templatePromise = supabase
        .from('public_api_endpoints')
        .select('*')
        .in('route', uncachedRoutes)
        .eq('data_type', 'template');

      // Batch fetch schema-based endpoints
      const schemaPromise = supabase
        .from('public_api_data')
        .select('*')
        .in('route', uncachedRoutes);

      const [templateResult, schemaResult] = await Promise.all([
        templatePromise,
        schemaPromise
      ]);

      // Cache all results
      const allData = [
        ...(templateResult.data || []),
        ...(schemaResult.data || [])
      ];

      allData.forEach(endpoint => {
        this.cache.set(`public:${endpoint.route}`, {
          data: endpoint as DirectApiResponse,
          cachedAt: Date.now()
        });
      });

      console.log(`Prefetched ${allData.length} endpoints`);
    } catch (error) {
      console.error('Prefetch error:', error);
    }
  }

  /**
   * Clear cache for a specific route or all routes
   */
  clearCache(route?: string): void {
    if (route) {
      this.cache.delete(`public:${route}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const fresh = entries.filter(([_, v]) => (now - v.cachedAt) < this.CACHE_TTL);
    
    return {
      total: this.cache.size,
      fresh: fresh.length,
      stale: this.cache.size - fresh.length,
      hitRate: fresh.length / (this.cache.size || 1)
    };
  }
}

/**
 * Public API for direct endpoint access
 */
export const directApi = DirectApiClient.getInstance();

/**
 * Utility function to get the direct Supabase REST URL for an endpoint
 * This can be used for public APIs that don't need access control
 */
export function getDirectApiUrl(route: string, dataType: 'template' | 'schema' = 'template'): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const tableName = dataType === 'schema' ? 'public_api_data' : 'public_api_endpoints';
  
  return `${supabaseUrl}/rest/v1/${tableName}?route=eq.${encodeURIComponent(route)}&select=response_data&apikey=${anonKey}`;
}

/**
 * Fetch endpoint data using native fetch with optimal headers
 * Fastest possible approach for static data
 */
export async function fetchDirectEndpoint(route: string): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Try template-based first (usually faster)
    const templateUrl = getDirectApiUrl(route, 'template');
    
    const response = await fetch(templateUrl, {
      headers: {
        'Accept': 'application/vnd.pgrst.object+json', // Get single object, not array
        'Cache-Control': 'max-age=60', // Browser cache for 1 minute
      }
    });

    if (response.ok) {
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      console.log(`Direct fetch (template) for ${route}: ${responseTime}ms`);
      
      return data.response_data;
    }

    // If template not found, try schema-based
    if (response.status === 404 || response.status === 406) {
      const schemaUrl = getDirectApiUrl(route, 'schema');
      
      const schemaResponse = await fetch(schemaUrl, {
        headers: {
          'Accept': 'application/vnd.pgrst.object+json',
          'Cache-Control': 'max-age=60',
        }
      });

      if (schemaResponse.ok) {
        const data = await schemaResponse.json();
        const responseTime = Date.now() - startTime;
        console.log(`Direct fetch (schema) for ${route}: ${responseTime}ms`);
        
        return data.response_data;
      }
    }

    throw new Error(`API endpoint not found: ${route}`);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`Direct fetch error for ${route} (${responseTime}ms):`, error);
    throw error;
  }
}