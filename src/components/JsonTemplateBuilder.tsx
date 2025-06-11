import React, { useState } from 'react';
import { JsonTemplate } from '../hooks/useJsonTemplates';
import { JsonEditor } from './JsonEditor';
import { validateJson } from '../utils/jsonValidator';
import { X, Save, Code, Info, AlertCircle } from 'lucide-react';

interface JsonTemplateBuilderProps {
  projectId: string;
  template?: JsonTemplate;
  onSave: (template: { name: string; description: string; json_data: any }) => void;
  onCancel: () => void;
}

export const JsonTemplateBuilder: React.FC<JsonTemplateBuilderProps> = ({
  projectId,
  template,
  onSave,
  onCancel,
}) => {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [jsonData, setJsonData] = useState(
    template ? JSON.stringify(template.json_data, null, 2) : 
    '{\n  "message": "Hello, World!",\n  "status": "success",\n  "data": {\n    "id": 1,\n    "name": "Example"\n  }\n}'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateTemplate = () => {
    const newErrors: Record<string, string> = {};

    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }

    const jsonValidation = validateJson(jsonData);
    if (!jsonValidation.isValid) {
      newErrors.jsonData = jsonValidation.error || 'Invalid JSON';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      try {
        const parsedJson = JSON.parse(jsonData);
        onSave({
          name: templateName,
          description: templateDescription,
          json_data: parsedJson,
        });
      } catch (error) {
        setErrors({ jsonData: 'Invalid JSON format' });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {template ? 'Edit JSON Template' : 'Create JSON Template'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {template ? 'Update your reusable JSON template' : 'Create reusable JSON templates for your API endpoints'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Template Information Section */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Template Information</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="User Response, Product List, Error Response..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.templateName ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.templateName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.templateName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe what this JSON template represents..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* JSON Template Guide */}
          <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2 mb-4">
              <Code className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">JSON Template Examples</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">User Profile</h5>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "status": "success"
}`}
                </pre>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-100 dark:border-green-800">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Product List</h5>
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`{
  "products": [
    {
      "id": 1,
      "name": "Product 1",
      "price": 99.99
    }
  ],
  "total": 1
}`}
                </pre>
              </div>
            </div>
          </section>

          {/* JSON Editor Section */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Code className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">JSON Template</h3>
            </div>

            <JsonEditor
              value={jsonData}
              onChange={setJsonData}
              placeholder='{\n  "message": "Hello, World!",\n  "status": "success"\n}'
            />
            {errors.jsonData && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.jsonData}
              </p>
            )}
          </section>

          {/* Actions */}
          <section className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
            >
              <Save className="w-5 h-5" />
              <span>{template ? 'Update Template' : 'Create Template'}</span>
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};