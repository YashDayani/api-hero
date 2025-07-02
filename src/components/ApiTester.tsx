import React, { useState } from 'react';
import { ApiEndpoint } from '../hooks/useApis';
import { Play, X, Copy, Check, Globe, ExternalLink, Lock, Key } from 'lucide-react';

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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // Ensure the route starts with /
    let route = api.route;
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    return `${supabaseUrl}/functions/v1/api-proxy${route}`;
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const apiUrl = getApiUrl();
      console.log('Testing API URL:', apiUrl);
      
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
    let curlCommand = `curl -X GET "${getApiUrl()}"`;
    
    if (!api.is_public && api.api_key) {
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {api.is_public ? (
              <Globe className="w-6 h-6 text-green-600" />
            ) : (
              <Lock className="w-6 h-6 text-orange-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold">API Endpoint Tester</h2>
              <p className="text-gray-600 text-sm mt-1">Test your live API endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                GET
              </span>
              <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                {api.route}
              </code>
              {!api.is_public && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Private
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{api.name}</h3>
            {api.description && (
              <p className="text-gray-600 text-sm mb-3">{api.description}</p>
            )}
            
            <div className="flex items-center space-x-2 text-sm mb-3">
              <strong>Live URL:</strong>
              <code className="bg-white px-2 py-1 rounded text-xs font-mono flex-1">
                {getApiUrl()}
              </code>
              <button
                onClick={handleCopyUrl}
                className="text-gray-500 hover:text-blue-600 transition-colors"
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
              {api.is_public && (
                <button
                  onClick={handleOpenUrl}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            {!api.is_public && api.api_key && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">API Key Required</span>
                </div>
                <p className="text-xs text-orange-700 mb-2">
                  This is a private endpoint. Include the API key in your request header:
                </p>
                <code className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded block">
                  x-api-key: {api.api_key}
                </code>
              </div>
            )}

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleCopyCurlCommand}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors"
                title="Copy cURL command"
              >
                {copied ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>{loading ? 'Testing...' : 'Test Live API'}</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
              {!api.is_public && (
                <p className="text-red-600 text-sm mt-2">
                  Make sure you're including the correct API key in the x-api-key header.
                </p>
              )}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-800">Live Response</h3>
                <button
                  onClick={handleCopyResponse}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="border border-green-200 bg-green-50 rounded-lg">
                <div className="p-4">
                  <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Expected Response Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Expected Response</h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-4">
                <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
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