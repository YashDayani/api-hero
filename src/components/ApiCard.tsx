import React, { useState } from 'react';
import { ApiEndpoint } from '../hooks/useApis';
import { Edit2, Trash2, Play, Copy, Check, Globe, ExternalLink, Lock, Unlock, Key, RefreshCw, Database, Code, AlertTriangle, FileText, Zap } from 'lucide-react';
import { getDirectApiUrl } from '../lib/directApi';

interface ApiCardProps {
  api: ApiEndpoint;
  onEdit: (api: ApiEndpoint) => void;
  onDelete: (id: string) => void;
  onTest: (api: ApiEndpoint) => void;
  onRegenerateKey: (id: string) => void;
}

export const ApiCard: React.FC<ApiCardProps> = ({
  api,
  onEdit,
  onDelete,
  onTest,
  onRegenerateKey,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const getApiUrl = () => {
    if (api.is_public) {
      // For public endpoints, return the direct Supabase REST API URL
      return getDirectApiUrl(api.route, api.data_type as 'template' | 'schema');
    } else {
      // For private endpoints, use the edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Ensure the route starts with /
      let route = api.route;
      if (!route.startsWith('/')) {
        route = '/' + route;
      }
      return `${supabaseUrl}/functions/v1/api-proxy${route}`;
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(getApiUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyApiKey = async () => {
    if (api.api_key) {
      await navigator.clipboard.writeText(api.api_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleOpenUrl = () => {
    window.open(getApiUrl(), '_blank');
  };

  const handleDelete = async () => {
    await onDelete(api.id);
    setShowDeleteConfirm(false);
  };

  const handleRegenerateKey = async () => {
    await onRegenerateKey(api.id);
  };

  const formatJsonPreview = (jsonData: any) => {
    try {
      const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
      return jsonString.length > 100 ? jsonString.substring(0, 100) + '...' : jsonString;
    } catch {
      return 'Invalid JSON';
    }
  };

  const getDataTypeInfo = () => {
    if (api.data_type === 'schema') {
      return {
        icon: Database,
        label: 'Schema-based',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Dynamic data managed through the UI'
      };
    } else if (api.template_id) {
      return {
        icon: FileText,
        label: 'Template',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Uses a reusable JSON template'
      };
    } else {
      return {
        icon: Code,
        label: 'Custom JSON',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Custom JSON response'
      };
    }
  };

  const dataTypeInfo = getDataTypeInfo();
  const DataTypeIcon = dataTypeInfo.icon;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {api.is_public ? (
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{api.name}</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                GET
              </span>
              {!api.is_public && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  Private
                </span>
              )}
              {api.is_public && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Fast</span>
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${dataTypeInfo.bgColor} ${dataTypeInfo.color} dark:bg-opacity-20`}>
                {dataTypeInfo.label}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                {api.route}
              </code>
              <button
                onClick={handleCopyUrl}
                className="text-gray-500 hover:text-blue-600 transition-colors"
                title="Copy API URL"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              {api.is_public && (
                <button
                  onClick={handleOpenUrl}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                  title="Open API URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {api.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{api.description}</p>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              <strong>API URL:</strong> {getApiUrl()}
            </div>

            {api.is_public && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2 mb-2">
                <span className="text-xs text-blue-800 dark:text-blue-200 flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Direct REST API: ~50-100ms response time
                </span>
              </div>
            )}

            {!api.is_public && api.api_key && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-orange-800 dark:text-orange-200">API Key Required:</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                      title={showApiKey ? "Hide API Key" : "Show API Key"}
                    >
                      {showApiKey ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={handleCopyApiKey}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                      title="Copy API Key"
                    >
                      {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={handleRegenerateKey}
                      className="text-orange-600 hover:text-orange-800 transition-colors"
                      title="Regenerate API Key"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {showApiKey && (
                  <code className="text-xs text-orange-700 dark:text-orange-300 block mt-1 break-all">
                    {api.api_key}
                  </code>
                )}
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Add header: <code>x-api-key: {showApiKey ? api.api_key : '••••••••'}</code>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <DataTypeIcon className={`w-4 h-4 ${dataTypeInfo.color}`} />
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {dataTypeInfo.description}:
            </h4>
          </div>
          {api.data_type === 'schema' ? (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Dynamic data managed through the UI
            </p>
          ) : (
            <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto max-h-20">
              {formatJsonPreview(api.json_data)}
            </pre>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
          <span>Created: {new Date(api.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(api.updated_at).toLocaleDateString()}</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onTest(api)}
            className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Test</span>
          </button>
          
          <button
            onClick={() => onEdit(api)}
            className="flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Delete API Endpoint</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{api.name}"</span>?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    GET
                  </span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {api.route}
                  </code>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The API endpoint will be permanently removed and will no longer be accessible.
              </p>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete API
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};