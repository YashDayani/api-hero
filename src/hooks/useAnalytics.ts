import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface AnalyticsData {
  id: string;
  api_endpoint_id: string;
  request_method: string;
  request_path: string;
  request_ip: string;
  request_user_agent: string;
  response_status: number;
  response_time_ms: number;
  response_size_bytes: number;
  country_code: string;
  region: string;
  city: string;
  timestamp: string;
  error_message?: string;
}

export interface PerformanceMetrics {
  id: string;
  api_endpoint_id: string;
  period_type: 'hour' | 'day' | 'week' | 'month';
  period_start: string;
  period_end: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  min_response_time_ms: number;
  max_response_time_ms: number;
  total_bytes_transferred: number;
  error_4xx_count: number;
  error_5xx_count: number;
}

export interface GeographicData {
  id: string;
  api_endpoint_id: string;
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  request_count: number;
  avg_response_time_ms: number;
  last_seen: string;
}

export interface DashboardStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  errorRate: number;
  topCountries: Array<{ country: string; requests: number }>;
  topEndpoints: Array<{ endpoint: string; requests: number }>;
  dailyStats: Array<{ date: string; requests: number; errors: number }>;
  hourlyStats: Array<{ hour: number; requests: number; avgResponseTime: number }>;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async (
    projectId?: string,
    endpointId?: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit: number = 1000
  ): Promise<AnalyticsData[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('api_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (endpointId) {
        query = query.eq('api_endpoint_id', endpointId);
      }

      // Add time range filter
      const now = new Date();
      let startTime: Date;
      
      switch (timeRange) {
        case 'hour':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      query = query.gte('timestamp', startTime.toISOString());

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPerformanceMetrics = useCallback(async (
    projectId?: string,
    endpointId?: string,
    periodType: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit: number = 100
  ): Promise<PerformanceMetrics[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('api_performance_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (endpointId) {
        query = query.eq('api_endpoint_id', endpointId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchGeographicData = useCallback(async (
    projectId?: string,
    endpointId?: string,
    limit: number = 100
  ): Promise<GeographicData[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('api_geographic_data')
        .select('*')
        .eq('user_id', user.id)
        .order('request_count', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (endpointId) {
        query = query.eq('api_endpoint_id', endpointId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getDashboardStats = useCallback(async (
    projectId?: string,
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): Promise<DashboardStats> => {
    if (!user) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorRate: 0,
        topCountries: [],
        topEndpoints: [],
        dailyStats: [],
        hourlyStats: []
      };
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch raw analytics data for calculations
      const analyticsData = await fetchAnalyticsData(projectId, undefined, timeRange, 10000);
      
      if (analyticsData.length === 0) {
        return {
          totalRequests: 0,
          successRate: 0,
          avgResponseTime: 0,
          errorRate: 0,
          topCountries: [],
          topEndpoints: [],
          dailyStats: [],
          hourlyStats: []
        };
      }

      // Calculate basic stats
      const totalRequests = analyticsData.length;
      const successfulRequests = analyticsData.filter(d => d.response_status >= 200 && d.response_status < 400).length;
      const errorRequests = analyticsData.filter(d => d.response_status >= 400).length;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
      const avgResponseTime = analyticsData.reduce((sum, d) => sum + d.response_time_ms, 0) / totalRequests;

      // Calculate top countries
      const countryStats = analyticsData.reduce((acc, d) => {
        const country = d.country_code || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topCountries = Object.entries(countryStats)
        .map(([country, requests]) => ({ country, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);

      // Calculate top endpoints
      const endpointStats = analyticsData.reduce((acc, d) => {
        const endpoint = d.request_path || 'Unknown';
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topEndpoints = Object.entries(endpointStats)
        .map(([endpoint, requests]) => ({ endpoint, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);

      // Calculate daily stats
      const dailyStatsMap = analyticsData.reduce((acc, d) => {
        const date = new Date(d.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { requests: 0, errors: 0 };
        }
        acc[date].requests += 1;
        if (d.response_status >= 400) {
          acc[date].errors += 1;
        }
        return acc;
      }, {} as Record<string, { requests: number; errors: number }>);

      const dailyStats = Object.entries(dailyStatsMap)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate hourly stats (for today)
      const today = new Date().toISOString().split('T')[0];
      const todayData = analyticsData.filter(d => d.timestamp.startsWith(today));
      
      const hourlyStatsMap = todayData.reduce((acc, d) => {
        const hour = new Date(d.timestamp).getHours();
        if (!acc[hour]) {
          acc[hour] = { requests: 0, totalResponseTime: 0 };
        }
        acc[hour].requests += 1;
        acc[hour].totalResponseTime += d.response_time_ms;
        return acc;
      }, {} as Record<number, { requests: number; totalResponseTime: number }>);

      const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
        const stats = hourlyStatsMap[hour];
        return {
          hour,
          requests: stats?.requests || 0,
          avgResponseTime: stats ? stats.totalResponseTime / stats.requests : 0
        };
      });

      return {
        totalRequests,
        successRate,
        avgResponseTime,
        errorRate,
        topCountries,
        topEndpoints,
        dailyStats,
        hourlyStats
      };
    } catch (err: any) {
      setError(err.message);
      return {
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorRate: 0,
        topCountries: [],
        topEndpoints: [],
        dailyStats: [],
        hourlyStats: []
      };
    } finally {
      setLoading(false);
    }
  }, [user, fetchAnalyticsData]);

  return {
    loading,
    error,
    fetchAnalyticsData,
    fetchPerformanceMetrics,
    fetchGeographicData,
    getDashboardStats
  };
};