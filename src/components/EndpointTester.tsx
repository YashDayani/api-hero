import React, { useState } from 'react';
import { Endpoint, EndpointResponse } from '../types/endpoint';
import { Play, X, Copy, Check } from 'lucide-react';

interface EndpointTesterProps {
  endpoint: Endpoint;
  onClose: () => void;
}

export const EndpointTester: React.FC<EndpointTesterProps> = ({
  endpoint,
  onClose,
}) => {
  const [response, setResponse] = useState<EndpointResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const parsedData = JSON.parse(endpoint.jsonData);
      setResponse({
        success: true,
        data: parsedData,
        status: 200,
      });
    } catch (error) {
      setResponse({
        success: false,
        error: 'Invalid JSON data',
        status: 500,
      });
    }
    
    setLoading(false);
  };

  const handleCopyResponse = async () => {
    if (response?.data) {
      await navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">API Endpoint Tester</h2>
            <p className="text-gray-600 text-sm mt-1">Test your endpoint and see the response</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Endpoint Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {endpoint.method}
              </span>
              <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                {endpoint.route}
              </code>
            </div>
            <h3 className="font-semibold text-gray-900">{endpoint.name}</h3>
            {endpoint.description && (
              <p className="text-gray-600 text-sm mt-1">{endpoint.description}</p>
            )}
          </div>

          {/* Test Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>{loading ? 'Testing...' : 'Test Endpoint'}</span>
            </button>
          </div>

          {/* Response */}
          {response && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Response</h3>
                <div className="flex items-center space-x-3">
                  <span className={`font-mono font-semibold ${getStatusColor(response.status)}`}>
                    {response.status}
                  </span>
                  {response.success && (
                    <button
                      onClick={handleCopyResponse}
                      className="text-gray-500 hover:text-blue-600 transition-colors"
                      title="Copy response"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div className={`rounded-lg border ${
                response.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="p-4">
                  {response.success ? (
                    <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-red-600">
                      <strong>Error:</strong> {response.error}
                    </div>
                  )}
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
                  {endpoint.jsonData}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};