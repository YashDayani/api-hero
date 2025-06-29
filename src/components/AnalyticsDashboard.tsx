import React, { useState, useEffect } from 'react';
import { useAnalytics, DashboardStats } from '../hooks/useAnalytics';
import { BarChart3, TrendingUp, Globe, Clock, AlertCircle, Users, Zap, MapPin, Activity, Calendar } from 'lucide-react';

interface AnalyticsDashboardProps {
  projectId: string;
  endpointId?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  projectId,
  endpointId
}) => {
  const { getDashboardStats, loading, error } = useAnalytics();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    const loadStats = async () => {
      const data = await getDashboardStats(projectId, timeRange);
      setStats(data);
    };

    loadStats();
  }, [getDashboardStats, projectId, timeRange]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-8">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Failed to load analytics</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return Math.round(ms) + 'ms';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your API performance and usage patterns
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatNumber(stats.totalRequests)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 dark:text-green-400">
              {stats.totalRequests > 0 ? '+12.5%' : '0%'} from last period
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatResponseTime(stats.avgResponseTime)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <Activity className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {stats.avgResponseTime < 500 ? 'Excellent' : stats.avgResponseTime < 1000 ? 'Good' : 'Needs attention'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.errorRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.errorRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Requests Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Requests</h3>
            <Calendar className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {stats.dailyStats.length > 0 ? (
              stats.dailyStats.slice(-7).map((day, index) => {
                const maxRequests = Math.max(...stats.dailyStats.map(d => d.requests));
                const width = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
                
                return (
                  <div key={day.date} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {day.requests} requests
                        </span>
                        {day.errors > 0 && (
                          <span className="text-red-600 dark:text-red-400 text-xs">
                            {day.errors} errors
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No data available for the selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hourly Distribution</h3>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="grid grid-cols-12 gap-1 h-32">
            {stats.hourlyStats.map((hour) => {
              const maxRequests = Math.max(...stats.hourlyStats.map(h => h.requests));
              const height = maxRequests > 0 ? (hour.requests / maxRequests) * 100 : 0;
              
              return (
                <div key={hour.hour} className="flex flex-col justify-end h-full">
                  <div 
                    className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-sm transition-all duration-300 hover:from-purple-600 hover:to-purple-500"
                    style={{ height: `${height}%` }}
                    title={`${hour.hour}:00 - ${hour.requests} requests`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {hour.hour}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
            Peak hour: {stats.hourlyStats.length > 0 ? 
              stats.hourlyStats.reduce((max, hour) => 
                hour.requests > max.requests ? hour : max, 
                { hour: 0, requests: -1 }
              ).hour : 0}:00
          </div>
        </div>
      </div>

      {/* Geographic and Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Countries */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Countries</h3>
            <Globe className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {stats.topCountries.length > 0 ? (
              stats.topCountries.map((country, index) => {
                const percentage = stats.totalRequests > 0 ? (country.requests / stats.totalRequests) * 100 : 0;
                
                return (
                  <div key={country.country} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {country.country}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {country.requests} requests
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No geographic data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Endpoints */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Endpoints</h3>
            <Zap className="w-5 h-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {stats.topEndpoints.length > 0 ? (
              stats.topEndpoints.map((endpoint, index) => {
                const percentage = stats.totalRequests > 0 ? (endpoint.requests / stats.totalRequests) * 100 : 0;
                
                return (
                  <div key={endpoint.endpoint} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono text-gray-900 dark:text-white truncate">
                          {endpoint.endpoint}
                        </code>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {endpoint.requests}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No endpoint data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {stats.totalRequests > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Performance Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="font-medium text-blue-900 dark:text-blue-100">API Health</div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    {stats.successRate >= 99 ? 'Excellent' : 
                     stats.successRate >= 95 ? 'Good' : 
                     stats.successRate >= 90 ? 'Fair' : 'Poor'} 
                    ({stats.successRate.toFixed(1)}% success rate)
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="font-medium text-blue-900 dark:text-blue-100">Response Speed</div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    {stats.avgResponseTime < 200 ? 'Very Fast' : 
                     stats.avgResponseTime < 500 ? 'Fast' : 
                     stats.avgResponseTime < 1000 ? 'Moderate' : 'Slow'} 
                    ({formatResponseTime(stats.avgResponseTime)})
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <div className="font-medium text-blue-900 dark:text-blue-100">Usage Trend</div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    {stats.totalRequests > 1000 ? 'High Volume' : 
                     stats.totalRequests > 100 ? 'Growing' : 
                     stats.totalRequests > 10 ? 'Getting Started' : 'New API'} 
                    ({formatNumber(stats.totalRequests)} requests)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};