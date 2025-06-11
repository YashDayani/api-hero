import React, { useState, useEffect } from 'react';
import { ApiSchema, ApiDataEntry, useSchemas, SchemaField } from '../hooks/useSchemas';
import { useAuth } from '../hooks/useAuth';
import { Plus, Edit2, Trash2, Database, Calendar, User, X, Save } from 'lucide-react';

interface DataManagerProps {
  schema: ApiSchema;
  onClose: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ schema, onClose }) => {
  const { user } = useAuth();
  const { addDataEntry, updateDataEntry, deleteDataEntry, getDataBySchemaId } = useSchemas();
  const [dataEntries, setDataEntries] = useState<ApiDataEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApiDataEntry | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data only when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('DataManager mounted for schema:', schema.id);
      loadData();
    }
  }, [schema.id, user]);

  const loadData = async () => {
    console.log('Loading data for schema:', schema.id);
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDataBySchemaId(schema.id, user);
      console.log('Loaded data entries:', data);
      setDataEntries(data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data entries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    // Initialize form data with default values
    const initialData: Record<string, any> = {};
    schema.fields.forEach(field => {
      if (field.type === 'array') {
        initialData[field.name] = [];
      } else if (field.type === 'object') {
        const objData: Record<string, any> = {};
        field.objectFields?.forEach(objField => {
          objData[objField.name] = '';
        });
        initialData[field.name] = objData;
      } else if (field.type === 'boolean') {
        initialData[field.name] = false;
      } else if (field.type === 'number') {
        initialData[field.name] = 0;
      } else {
        initialData[field.name] = '';
      }
    });
    setFormData(initialData);
    setShowForm(true);
  };

  const handleEdit = (entry: ApiDataEntry) => {
    setEditingEntry(entry);
    setFormData({ ...entry.data });
    setShowForm(true);
  };

  const handleSave = async () => {
    console.log('Saving form data:', formData);
    
    try {
      if (editingEntry) {
        const success = await updateDataEntry(editingEntry.id, formData);
        console.log('Update result:', success);
        if (!success) {
          setError('Failed to update entry');
          return;
        }
      } else {
        const result = await addDataEntry(schema.id, formData);
        console.log('Add result:', result);
        if (!result) {
          setError('Failed to add entry');
          return;
        }
      }
      
      setShowForm(false);
      setEditingEntry(null);
      setFormData({});
      // Reload data after successful save
      await loadData();
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save entry');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const success = await deleteDataEntry(id);
        console.log('Delete result:', success);
        if (success) {
          // Reload data after successful delete
          await loadData();
        } else {
          setError('Failed to delete entry');
        }
      } catch (err) {
        console.error('Error deleting data:', err);
        setError('Failed to delete entry');
      }
    }
  };

  const updateFormField = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const updateArrayItem = (fieldName: string, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item: any, i: number) => i === index ? value : item)
    }));
  };

  const addArrayItem = (fieldName: string, field: SchemaField) => {
    const newItem = field.arrayItemType === 'object' ? {} : '';
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), newItem]
    }));
  };

  const removeArrayItem = (fieldName: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_: any, i: number) => i !== index)
    }));
  };

  const updateObjectField = (fieldName: string, objectFieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [objectFieldName]: value
      }
    }));
  };

  const isImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('image') || 
           lowerUrl.includes('img') ||
           lowerUrl.includes('photo');
  };

  const renderFieldInput = (field: SchemaField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div className="space-y-2">
            <input
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
              value={value}
              onChange={(e) => updateFormField(field.name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={field.required}
              placeholder={field.type === 'url' ? 'https://example.com' : ''}
            />
            {field.type === 'url' && value && isImageUrl(value) && (
              <div className="mt-2">
                <img src={value} alt="Preview" className="w-20 h-20 object-cover rounded border" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateFormField(field.name, parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <select
            value={value.toString()}
            onChange={(e) => updateFormField(field.name, e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          />
        );

      case 'array':
        const arrayValue = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Items ({arrayValue.length})</span>
              <button
                type="button"
                onClick={() => addArrayItem(field.name, field)}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
              >
                + Add Item
              </button>
            </div>
            {arrayValue.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type={field.arrayItemType === 'url' ? 'url' : field.arrayItemType === 'number' ? 'number' : 'text'}
                  value={item}
                  onChange={(e) => updateArrayItem(field.name, index, field.arrayItemType === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  placeholder={`Item ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(field.name, index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        );

      case 'object':
        const objectValue = value || {};
        return (
          <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Object Properties:</span>
            {field.objectFields?.map(objField => (
              <div key={objField.id}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {objField.name}
                  {objField.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {objField.type === 'textarea' ? (
                  <textarea
                    value={objectValue[objField.name] || ''}
                    onChange={(e) => updateObjectField(field.name, objField.name, e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                    required={objField.required}
                  />
                ) : (
                  <input
                    type={objField.type === 'email' ? 'email' : objField.type === 'url' ? 'url' : objField.type === 'number' ? 'number' : 'text'}
                    value={objectValue[objField.name] || ''}
                    onChange={(e) => updateObjectField(field.name, objField.name, objField.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    required={objField.required}
                  />
                )}
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateFormField(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={field.required}
          />
        );
    }
  };

  const formatValue = (value: any, field: SchemaField): React.ReactNode => {
    if (value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'array':
        if (Array.isArray(value)) {
          return `[${value.length} items]`;
        }
        return '-';
      case 'object':
        if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          return `{${keys.length} properties}`;
        }
        return '-';
      case 'url':
        if (value && isImageUrl(value)) {
          return (
            <img src={value} alt="Image" className="w-8 h-8 object-cover rounded" onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} />
          );
        }
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
            {value.length > 30 ? value.substring(0, 30) + '...' : value}
          </a>
        ) : '-';
      default:
        return value.toString();
    }
  };

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{schema.name} Data</h2>
              <p className="text-gray-600 text-sm">
                {loading ? 'Loading...' : `${dataEntries.length} entries`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddNew}
              className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-xs underline mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : dataEntries.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first data entry</p>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {schema.fields.map(field => (
                      <th key={field.id} className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        <div className="text-xs text-gray-500 font-normal">({field.type})</div>
                      </th>
                    ))}
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Created
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      {schema.fields.map(field => (
                        <td key={field.id} className="border border-gray-200 px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate">
                            {formatValue(entry.data[field.name], field)}
                          </div>
                        </td>
                      ))}
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {editingEntry ? 'Edit Entry' : 'Add New Entry'}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                {schema.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                    </label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEntry ? 'Update' : 'Save'}</span>
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};