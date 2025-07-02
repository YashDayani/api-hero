import React, { useState } from 'react';
import { ApiEndpoint } from '../hooks/useApis';
import { Play, X, Copy, Check, Globe, ExternalLink, Lock, Key } from 'lucide-react';
import { fetchDirectEndpoint, getDirectApiUrl } from '../lib/directApi';

interface ApiTesterProps {
  api: ApiEndpoint;
  onClose: () => void;
}

export const ApiTester: React.FC<ApiTesterProps> = ({
  api,
  onClose,
}) => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => {
    // For public endpoints, use the direct Supabase REST URL
    if (api.is_public) {
      return getDirectApiUrl(api.route, api.data_type as 'template' | 'schema');
    } else {
      // For private endpoints, still use the edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Ensure the route starts with /
      let route = api.route;
      if (!route.startsWith('/')) {
        route = '/' + route;
      }
      return `${supabaseUrl}/functions/v1/api-proxy${route}`;
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      if (api.is_public) {
        // Use direct API for public endpoints (much faster)
        const data = await fetchDirectEndpoint(api.route);
        setResponse(data);
      } else {
        // Use edge function for private endpoints
        const apiUrl = getApiUrl();
        console.log('Testing private API URL:', apiUrl);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add API key header if this is a private endpoint
        if (!api.is_public && api.api_key) {
          headers['x-api-key'] = api.api_key;
          console.log('Adding API key header for private endpoint');
        }

        console.log('Request headers:', headers);

        const res = await fetch(apiUrl, { headers });
        const data = await res.json();
        
        console.log('Response status:', res.status);
        console.log('Response data:', data);
        
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${data.error || data.message || 'Unknown error'}`);
        } else {
          setResponse(data);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(getApiUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurlCommand = async () => {
    const apiUrl = getApiUrl();
    let curlCommand = `curl -X GET "${apiUrl}"`;
    
    // For REST API, add apikey as a query parameter
    if (api.is_public) {
      // No additional parameters needed, apikey is included in the URL
    } else if (!api.is_public && api.api_key) {
      curlCommand += ` -H "x-api-key: ${api.api_key}"`;
    }
    
    await navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    if (api.is_public) {
      window.open(getApiUrl(), '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {api.is_public ? (
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">API Endpoint Tester</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{api.is_public ? 'Test your direct REST API endpoint' : 'Test your secure API endpoint'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                GET
              </span>
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                {api.route}
              </code>
              {!api.is_public && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                  Private
                </span>
              )}
              {api.is_public && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Direct REST API
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{api.name}</h3>
            {api.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{api.description}</p>
            )}
            
            <div className="flex items-center space-x-2 text-sm mb-3">
              <strong className="text-gray-700 dark:text-gray-300">URL:</strong>
              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono flex-1 text-gray-800 dark:text-gray-200 overflow-x-auto">
                {getApiUrl()}
              </code>
              <button
                onClick={handleCopyUrl}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
              {api.is_public && (
                <button
                  onClick={handleOpenUrl}
                  className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            {!api.is_public && api.api_key && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">API Key Required</span>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                  This is a private endpoint. Include the API key in your request header:
                </p>
                <code className="text-xs text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded block">
                  x-api-key: {api.api_key}
                </code>
              </div>
            )}

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleCopyCurlCommand}
                className="text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 px-2 py-1 rounded transition-colors text-gray-800 dark:text-gray-200"
                title="Copy cURL command"
              >
                {copied ? 'Copied!' : 'Copy cURL'}
              </button>
              
              {api.is_public && (
                <div className="text-xs text-green-700 dark:text-green-400">
                  <span className="font-semibold">Direct REST API:</span> 50-100ms response time
                </div>
              )}
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 dark:bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>{loading ? 'Testing...' : 'Test Live API'}</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              {!api.is_public && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  Make sure you're including the correct API key in the x-api-key header.
                </p>
              )}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Live Response</h3>
                <button
                  onClick={handleCopyResponse}
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="p-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Expected Response Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expected Response</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="p-4">
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(api.json_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};