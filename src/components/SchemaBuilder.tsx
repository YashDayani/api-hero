import React, { useState } from 'react';
import { SchemaField } from '../hooks/useSchemas';
import { AiSchemaGenerator } from './AiSchemaGenerator';
import { Plus, Trash2, Type, Hash, ToggleLeft, Calendar, Mail, Link, X, Save, FileText, List, Package, Info, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';

interface SchemaBuilderProps {
  projectId: string;
  onSave: (schema: { name: string; description: string; fields: SchemaField[] }) => void;
  onCancel: () => void;
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type, description: 'Short text input', color: 'text-blue-600' },
  { value: 'textarea', label: 'Long Text', icon: FileText, description: 'Multi-line text', color: 'text-indigo-600' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric values', color: 'text-green-600' },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft, description: 'True/False values', color: 'text-purple-600' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker', color: 'text-orange-600' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Email address', color: 'text-red-600' },
  { value: 'url', label: 'URL', icon: Link, description: 'Web links & images', color: 'text-cyan-600' },
  { value: 'array', label: 'Array', icon: List, description: 'List of items', color: 'text-yellow-600' },
  { value: 'object', label: 'Object', icon: Package, description: 'Nested structure', color: 'text-pink-600' },
] as const;

const arrayItemTypes = [
  { value: 'text', label: 'Text Items', description: 'List of text values' },
  { value: 'number', label: 'Number Items', description: 'List of numbers' },
  { value: 'url', label: 'URL Items', description: 'List of URLs' },
  { value: 'object', label: 'Object Items', description: 'List of objects' },
] as const;

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({
  projectId,
  onSave,
  onCancel,
}) => {
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  const addField = () => {
    const newField: SchemaField = {
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const addObjectField = (parentId: string) => {
    const newObjectField: SchemaField = {
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      required: false,
    };

    setFields(fields.map(field => {
      if (field.id === parentId) {
        return {
          ...field,
          objectFields: [...(field.objectFields || []), newObjectField]
        };
      }
      return field;
    }));
  };

  const updateObjectField = (parentId: string, fieldId: string, updates: Partial<SchemaField>) => {
    setFields(fields.map(field => {
      if (field.id === parentId) {
        return {
          ...field,
          objectFields: field.objectFields?.map(objField =>
            objField.id === fieldId ? { ...objField, ...updates } : objField
          )
        };
      }
      return field;
    }));
  };

  const removeObjectField = (parentId: string, fieldId: string) => {
    setFields(fields.map(field => {
      if (field.id === parentId) {
        return {
          ...field,
          objectFields: field.objectFields?.filter(objField => objField.id !== fieldId)
        };
      }
      return field;
    }));
  };

  const validateSchema = () => {
    const newErrors: Record<string, string> = {};

    if (!schemaName.trim()) {
      newErrors.schemaName = 'Schema name is required';
    }

    if (fields.length === 0) {
      newErrors.fields = 'At least one field is required';
    }

    // Validate field names
    const fieldNames = new Set();
    fields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field_${index}_name`] = 'Field name is required';
      } else if (fieldNames.has(field.name)) {
        newErrors[`field_${index}_name`] = 'Field names must be unique';
      } else {
        fieldNames.add(field.name);
      }

      // Validate object fields
      if (field.type === 'object' && field.objectFields) {
        const objectFieldNames = new Set();
        field.objectFields.forEach((objField, objIndex) => {
          if (!objField.name.trim()) {
            newErrors[`field_${index}_object_${objIndex}_name`] = 'Object field name is required';
          } else if (objectFieldNames.has(objField.name)) {
            newErrors[`field_${index}_object_${objIndex}_name`] = 'Object field names must be unique';
          } else {
            objectFieldNames.add(objField.name);
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateSchema()) {
      onSave({
        name: schemaName,
        description: schemaDescription,
        fields,
      });
    }
  };

  const handleAiGenerate = (name: string, description: string, generatedFields: SchemaField[]) => {
    setSchemaName(name);
    setSchemaDescription(description);
    setFields(generatedFields);
    setShowAiGenerator(false);
    setErrors({}); // Clear any existing errors
  };

  const getFieldIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType?.icon || Type;
  };

  const getFieldTypeInfo = (type: string) => {
    return fieldTypes.find(ft => ft.value === type);
  };

  const renderObjectFields = (parentField: SchemaField, parentIndex: number) => {
    if (parentField.type !== 'object') return null;

    return (
      <div className="mt-6 pl-6 border-l-2 border-gray-200 bg-gray-50 rounded-r-lg">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Object Properties</span>
              <div className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                {parentField.objectFields?.length || 0} properties
              </div>
            </div>
            <button
              onClick={() => addObjectField(parentField.id)}
              className="flex items-center space-x-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Property</span>
            </button>
          </div>
          
          {parentField.objectFields?.map((objField, objIndex) => {
            const ObjFieldIcon = getFieldIcon(objField.type);
            const objFieldTypeInfo = getFieldTypeInfo(objField.type);
            
            return (
              <div key={objField.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Field Name */}
                  <div className="lg:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      value={objField.name}
                      onChange={(e) => updateObjectField(parentField.id, objField.id, { name: e.target.value })}
                      placeholder="propertyName"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors[`field_${parentIndex}_object_${objIndex}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors[`field_${parentIndex}_object_${objIndex}_name`] && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors[`field_${parentIndex}_object_${objIndex}_name`]}
                      </p>
                    )}
                  </div>

                  {/* Field Type */}
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        value={objField.type}
                        onChange={(e) => updateObjectField(parentField.id, objField.id, { type: e.target.value as any })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="url">URL</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ObjFieldIcon className={`w-4 h-4 ${objFieldTypeInfo?.color || 'text-gray-400'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Required Toggle */}
                  <div className="lg:col-span-3 flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={objField.required}
                        onChange={(e) => updateObjectField(parentField.id, objField.id, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex justify-end">
                    <button
                      onClick={() => removeObjectField(parentField.id, objField.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {(!parentField.objectFields || parentField.objectFields.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No properties defined yet</p>
              <p className="text-xs text-gray-400">Click "Add Property" to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Data Schema</h2>
                <p className="text-gray-600 mt-1">Define the structure for your API data</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAiGenerator(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate with AI</span>
                </button>
                <button
                  onClick={onCancel}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Schema Information Section */}
            <section className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Schema Information</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Name *
                  </label>
                  <input
                    type="text"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    placeholder="Users, Products, Posts..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.schemaName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.schemaName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.schemaName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={schemaDescription}
                    onChange={(e) => setSchemaDescription(e.target.value)}
                    placeholder="Describe what this schema represents..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Field Types Guide */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-2 mb-4">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">Available Field Types</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {fieldTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <div key={type.value} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-blue-100">
                      <Icon className={`w-4 h-4 ${type.color}`} />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{type.label}</span>
                        <p className="text-xs text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Fields Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Type className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Schema Fields</h3>
                  <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={addField}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
              </div>

              {errors.fields && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.fields}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {fields.map((field, index) => {
                  const FieldIcon = getFieldIcon(field.type);
                  const fieldTypeInfo = getFieldTypeInfo(field.type);
                  
                  return (
                    <div key={field.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          {/* Field Name */}
                          <div className="lg:col-span-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Field Name *
                            </label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                              placeholder="name, email, age..."
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors[`field_${index}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                            />
                            {errors[`field_${index}_name`] && (
                              <p className="mt-2 text-sm text-red-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {errors[`field_${index}_name`]}
                              </p>
                            )}
                          </div>

                          {/* Field Type */}
                          <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type
                            </label>
                            <div className="relative">
                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                              >
                                {fieldTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <FieldIcon className={`w-5 h-5 ${fieldTypeInfo?.color || 'text-gray-400'}`} />
                              </div>
                            </div>
                          </div>

                          {/* Array Item Type (conditional) */}
                          {field.type === 'array' && (
                            <div className="lg:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Array Items
                              </label>
                              <select
                                value={field.arrayItemType || 'text'}
                                onChange={(e) => updateField(field.id, { arrayItemType: e.target.value as any })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                              >
                                {arrayItemTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Required Toggle */}
                          <div className={`${field.type === 'array' ? 'lg:col-span-1' : 'lg:col-span-3'} flex items-end`}>
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Required</span>
                            </label>
                          </div>

                          {/* Actions */}
                          <div className={`${field.type === 'array' ? 'lg:col-span-1' : 'lg:col-span-2'} flex justify-end`}>
                            <button
                              onClick={() => removeField(field.id)}
                              className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove field"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Object Fields (nested) */}
                      {renderObjectFields(field, index)}
                    </div>
                  );
                })}
              </div>

              {fields.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Type className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No fields added yet</h4>
                  <p className="text-gray-600 mb-6">Start building your schema by adding your first field</p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={addField}
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Your First Field</span>
                    </button>
                    <span className="text-gray-400">or</span>
                    <button
                      onClick={() => setShowAiGenerator(true)}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Generate with AI</span>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Actions */}
            <section className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <Save className="w-5 h-5" />
                <span>Create Schema</span>
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiGenerator && (
        <AiSchemaGenerator
          onGenerate={handleAiGenerate}
          onClose={() => setShowAiGenerator(false)}
        />
      )}
    </>
  );
};