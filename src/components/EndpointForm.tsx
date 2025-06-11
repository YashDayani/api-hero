import React, { useState, useEffect } from 'react';
import { Endpoint } from '../types/endpoint';
import { JsonEditor } from './JsonEditor';
import { validateJson } from '../utils/jsonValidator';
import { X, Save } from 'lucide-react';

interface EndpointFormProps {
  endpoint?: Endpoint;
  onSave: (endpoint: Omit<Endpoint, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const EndpointForm: React.FC<EndpointFormProps> = ({
  endpoint,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: endpoint?.name || '',
    route: endpoint?.route || '',
    method: endpoint?.method || 'GET' as const,
    jsonData: endpoint?.jsonData || '{\n  "message": "Hello, World!"\n}',
    description: endpoint?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Endpoint name is required';
    }

    if (!formData.route.trim()) {
      newErrors.route = 'Route is required';
    } else if (!formData.route.startsWith('/')) {
      newErrors.route = 'Route must start with /';
    }

    const jsonValidation = validateJson(formData.jsonData);
    if (!jsonValidation.isValid) {
      newErrors.jsonData = jsonValidation.error || 'Invalid JSON';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {endpoint ? 'Edit Endpoint' : 'Create New Endpoint'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="My API Endpoint"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route *
              </label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => handleInputChange('route', e.target.value)}
                placeholder="/api/users"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.route ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.route && <p className="mt-1 text-sm text-red-600">{errors.route}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={formData.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description of what this endpoint does..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <JsonEditor
            value={formData.jsonData}
            onChange={(value) => handleInputChange('jsonData', value)}
          />
          {errors.jsonData && (
            <p className="text-sm text-red-600">{errors.jsonData}</p>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{endpoint ? 'Update Endpoint' : 'Create Endpoint'}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};