import React, { useState, useEffect } from 'react';
import { ApiEndpoint } from '../hooks/useApis';
import { ApiSchema, useSchemas } from '../hooks/useSchemas';
import { JsonTemplate, useJsonTemplates } from '../hooks/useJsonTemplates';
import { useAuth } from '../hooks/useAuth';
import { X, Save, Globe, Lock, Info, Database, FileText, Edit3, Key, RefreshCw } from 'lucide-react';

interface ApiFormProps {
  projectId: string;
  projectName: string;
  api?: ApiEndpoint;
  onSave: (api: Omit<ApiEndpoint, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onCancel: () => void;
}

export const ApiForm: React.FC<ApiFormProps> = ({
  projectId,
  projectName,
  api,
  onSave,
  onCancel,
}) => {
  const { isSchemaMode } = useAuth();
  const { getSchemasByProjectId } = useSchemas();
  const { getTemplatesByProjectId } = useJsonTemplates();
  const projectSchemas = getSchemasByProjectId(projectId);
  const projectTemplates = getTemplatesByProjectId(projectId);

  // Extract route without project prefix for editing
  const getRouteWithoutPrefix = (fullRoute: string) => {
    const projectPrefix = `/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
    if (fullRoute.startsWith(projectPrefix)) {
      return fullRoute.substring(projectPrefix.length) || '/';
    }
    return fullRoute;
  };

  const [formData, setFormData] = useState({
    project_id: projectId,
    name: api?.name || '',
    route: api ? getRouteWithoutPrefix(api.route) : '',
    json_data: api?.json_data || {},
    description: api?.description || '',
    is_public: api?.is_public ?? true,
    requires_auth: api?.requires_auth ?? false,
    data_type: (api?.data_type as 'template' | 'schema') || 'template',
    schema_id: api?.schema_id || '',
    template_id: api?.template_id || '',
    api_key: api?.api_key || '', // Preserve existing API key
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'API name is required';
    }

    if (!formData.route.trim()) {
      newErrors.route = 'Route is required';
    } else {
      // Validate route format (should start with /)
      let route = formData.route.trim();
      if (!route.startsWith('/')) {
        route = '/' + route;
      }
      
      // Validate route format
      if (!/^\/[a-zA-Z0-9\-_\/]*$/.test(route)) {
        newErrors.route = 'Route can only contain letters, numbers, hyphens, underscores, and forward slashes';
      }
    }

    if (formData.data_type === 'template') {
      if (!formData.template_id) {
        newErrors.template_id = 'Please select a JSON template';
      }
    } else if (formData.data_type === 'schema' && isSchemaMode()) {
      if (!formData.schema_id) {
        newErrors.schema_id = 'Please select a schema';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateApiKey = () => {
    return 'ak_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Auto-format route with project prefix
      let route = formData.route.trim();
      const projectPrefix = `/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (!route.startsWith('/')) {
        route = '/' + route;
      }
      
      // Combine project prefix with route
      const fullRoute = projectPrefix + route;
      
      // Prepare the data based on type
      let finalJsonData = formData.json_data;
      
      if (formData.data_type === 'template' && formData.template_id) {
        const selectedTemplate = projectTemplates.find(t => t.id === formData.template_id);
        if (selectedTemplate) {
          finalJsonData = selectedTemplate.json_data;
        }
      }

      // Handle API key generation/preservation
      let finalApiKey = formData.api_key;
      if (!formData.is_public) {
        // For private endpoints, preserve existing key or generate new one if none exists
        if (!finalApiKey) {
          finalApiKey = generateApiKey();
        }
      } else {
        // For public endpoints, clear the API key
        finalApiKey = undefined;
      }
      
      onSave({
        ...formData,
        route: fullRoute,
        json_data: finalJsonData,
        api_key: finalApiKey,
        // Clear irrelevant fields based on data type
        schema_id: formData.data_type === 'schema' ? formData.schema_id : undefined,
        template_id: formData.data_type === 'template' ? formData.template_id : undefined,
      });
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDataTypeChange = (newDataType: 'template' | 'schema') => {
    setFormData(prev => ({ 
      ...prev, 
      data_type: newDataType,
      schema_id: newDataType === 'schema' ? '' : prev.schema_id,
      template_id: newDataType === 'template' ? '' : prev.template_id,
    }));
  };

  const handleTemplateChange = (templateId: string) => {
    setFormData(prev => ({ ...prev, template_id: templateId }));
    
    // Update the JSON data preview when template is selected
    if (templateId) {
      const selectedTemplate = projectTemplates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setFormData(prev => ({ ...prev, json_data: selectedTemplate.json_data }));
      }
    }
  };

  const handleAccessTypeChange = (isPublic: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      is_public: isPublic,
      // Preserve existing API key when switching to private, don't auto-generate
    }));
  };

  const handleRegenerateApiKey = () => {
    const newApiKey = generateApiKey();
    setFormData(prev => ({ ...prev, api_key: newApiKey }));
  };

  const getApiUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    let route = formData.route.trim();
    const projectPrefix = `/${projectName.toLowerCase().replace(/\s+/g, '-')}`;
    
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    
    const fullRoute = projectPrefix + route;
    return `${supabaseUrl}/functions/v1/api-proxy${fullRoute}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {api ? 'Edit API Endpoint' : 'Create New API Endpoint'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="User Profile API"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endpoint Route *
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  GET
                </span>
                <div className="flex-1 flex items-center">
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg">
                    /{projectName.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                  <div className="relative flex-1">
                    <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.route}
                      onChange={(e) => handleInputChange('route', e.target.value)}
                      placeholder="/users"
                      className={`w-full pl-10 pr-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.route ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
              {errors.route && <p className="text-sm text-red-600 dark:text-red-400">{errors.route}</p>}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Project Prefix:</strong> /{projectName.toLowerCase().replace(/\s+/g, '-')} (automatically added)
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  <strong>Full API URL:</strong> {getApiUrl()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description of what this API returns..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Data Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Type</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="template"
                  name="dataType"
                  checked={formData.data_type === 'template'}
                  onChange={() => handleDataTypeChange('template')}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="template" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">JSON Template</span>
                </label>
              </div>
              
              {/* Only show schema option if schema mode is enabled */}
              {isSchemaMode() && (
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="schema"
                    name="dataType"
                    checked={formData.data_type === 'schema'}
                    onChange={() => handleDataTypeChange('schema')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="schema" className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Schema-based Data</span>
                  </label>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">Data Types:</p>
                  <ul className="space-y-1">
                    <li><strong>JSON Template:</strong> Use a pre-created reusable JSON template</li>
                    {isSchemaMode() && (
                      <li><strong>Schema-based:</strong> Use structured data that you can manage through the UI</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          {formData.data_type === 'template' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select JSON Template *
              </label>
              <select
                value={formData.template_id}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.template_id ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Choose a JSON template...</option>
                {projectTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {errors.template_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.template_id}</p>}
              
              {projectTemplates.length === 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  No JSON templates available. Create a template first in the JSON Templates section.
                </p>
              )}
            </div>
          )}

          {/* Schema Selection - Only show if schema mode is enabled */}
          {formData.data_type === 'schema' && isSchemaMode() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Schema *
              </label>
              <select
                value={formData.schema_id}
                onChange={(e) => handleInputChange('schema_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.schema_id ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Choose a schema...</option>
                {projectSchemas.map(schema => (
                  <option key={schema.id} value={schema.id}>
                    {schema.name} ({schema.fields.length} fields)
                  </option>
                ))}
              </select>
              {errors.schema_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.schema_id}</p>}
              
              {projectSchemas.length === 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  No schemas available. Create a schema first to use structured data.
                </p>
              )}
            </div>
          )}

          {/* JSON Preview for template */}
          {formData.data_type === 'template' && formData.template_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Preview
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="p-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(formData.json_data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Access Control */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Access Control</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="public"
                  name="access"
                  checked={formData.is_public}
                  onChange={() => handleAccessTypeChange(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="public" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Public Access</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="private"
                  name="access"
                  checked={!formData.is_public}
                  onChange={() => handleAccessTypeChange(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="private" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Private (Requires API Key)</span>
                </label>
              </div>
            </div>

            {/* API Key Management for Private Endpoints */}
            {!formData.is_public && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Key className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">API Key Configuration</span>
                </div>
                
                {formData.api_key ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                        Current API Key
                      </label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 px-2 py-1 rounded border">
                          {formData.api_key}
                        </code>
                        <button
                          type="button"
                          onClick={handleRegenerateApiKey}
                          className="flex items-center space-x-1 text-xs bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-800 dark:text-orange-200 px-2 py-1 rounded transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Include this key in the <code>x-api-key</code> header when making requests to this endpoint.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      An API key will be automatically generated for this private endpoint.
                    </p>
                    <button
                      type="button"
                      onClick={handleRegenerateApiKey}
                      className="flex items-center space-x-1 text-sm bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-800 dark:text-orange-200 px-3 py-1 rounded transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      <span>Generate API Key Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">Access Types:</p>
                  <ul className="space-y-1">
                    <li><strong>Public:</strong> Anyone can access the API directly via URL</li>
                    <li><strong>Private:</strong> Requires API key in <code>x-api-key</code> header</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{api ? 'Update API' : 'Create API'}</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};