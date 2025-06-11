import React, { useState } from 'react';
import { Endpoint } from '../types/endpoint';
import { Edit2, Trash2, Play, Copy, Check } from 'lucide-react';

interface EndpointCardProps {
  endpoint: Endpoint;
  onEdit: (endpoint: Endpoint) => void;
  onDelete: (id: string) => void;
  onTest: (endpoint: Endpoint) => void;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({
  endpoint,
  onEdit,
  onDelete,
  onTest,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyRoute = async () => {
    await navigator.clipboard.writeText(endpoint.route);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(endpoint.id);
    setShowDeleteConfirm(false);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{endpoint.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(endpoint.method)}`}>
              {endpoint.method}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
              {endpoint.route}
            </code>
            <button
              onClick={handleCopyRoute}
              className="text-gray-500 hover:text-blue-600 transition-colors"
              title="Copy route"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          
          {endpoint.description && (
            <p className="text-gray-600 text-sm">{endpoint.description}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 mb-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">JSON Response Preview:</h4>
        <pre className="text-xs text-gray-600 overflow-x-auto max-h-20">
          {endpoint.jsonData.length > 100 
            ? endpoint.jsonData.substring(0, 100) + '...'
            : endpoint.jsonData
          }
        </pre>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>Created: {new Date(endpoint.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(endpoint.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onTest(endpoint)}
          className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Test</span>
        </button>
        
        <button
          onClick={() => onEdit(endpoint)}
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Endpoint</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{endpoint.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};