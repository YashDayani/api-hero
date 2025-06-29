import React, { useState } from 'react';
import { Sparkles, Wand2, X, Check, RefreshCw, AlertCircle, Lightbulb, Database, Edit3 } from 'lucide-react';
import { SchemaField } from '../hooks/useSchemas';

interface AiSchemaEditorProps {
  currentSchema: {
    name: string;
    description: string;
    fields: SchemaField[];
  };
  onUpdate: (name: string, description: string, fields: SchemaField[]) => void;
  onClose: () => void;
}

export const AiSchemaEditor: React.FC<AiSchemaEditorProps> = ({
  currentSchema,
  onUpdate,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [updatedSchema, setUpdatedSchema] = useState<{
    name: string;
    description: string;
    fields: SchemaField[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    "Add social media links and profile picture fields",
    "Include address and contact information fields",
    "Add pricing, inventory, and category fields",
    "Include timestamps, status, and metadata fields",
    "Add rating, review, and feedback fields",
    "Include location, coordinates, and map data",
    "Add permissions, roles, and access control fields",
    "Include analytics, metrics, and tracking data",
    "Add file attachments and media fields",
    "Include workflow, approval, and process fields"
  ];

  const generateWithGemini = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the changes you want to make');
      return;
    }

    setLoading(true);
    setError(null);
    setUpdatedSchema(null);

    try {
      // Convert current schema to a readable format for the AI
      const currentSchemaText = JSON.stringify({
        name: currentSchema.name,
        description: currentSchema.description,
        fields: currentSchema.fields.map(field => ({
          name: field.name,
          type: field.type,
          required: field.required,
          arrayItemType: field.arrayItemType,
          objectFields: field.objectFields?.map(objField => ({
            name: objField.name,
            type: objField.type,
            required: objField.required
          }))
        }))
      }, null, 2);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a database schema editor. You need to modify an existing schema based on the user's request.

Current Schema:
${currentSchemaText}

User's Modification Request: "${prompt}"

Available field types:
- text: Short text input
- textarea: Multi-line text
- number: Numeric values
- boolean: True/False values
- date: Date picker
- email: Email address
- url: Web links & images
- array: List of items (can contain text, number, url, or object items)
- object: Nested structure with sub-fields

Instructions:
1. Analyze the current schema and the user's request
2. Make the requested modifications while preserving existing relevant fields
3. Add new fields as requested
4. Modify existing fields if needed
5. Remove fields only if explicitly requested
6. Update the schema name and description if appropriate
7. Ensure the modified schema is logical and well-structured
8. Use appropriate field types for new fields
9. Mark important fields as required
10. For array fields, specify the arrayItemType
11. For object fields, include appropriate objectFields

Format your response as a JSON object with this exact structure:
{
  "schemaName": "Updated Schema Name",
  "schemaDescription": "Updated description of what this schema represents",
  "fields": [
    {
      "name": "field_name",
      "type": "text|textarea|number|boolean|date|email|url|array|object",
      "required": true|false,
      "arrayItemType": "text|number|url|object" (only for array fields),
      "objectFields": [
        {
          "name": "sub_field_name",
          "type": "text|textarea|number|boolean|date|email|url",
          "required": true|false
        }
      ] (only for object fields)
    }
  ]
}

Make sure to create a comprehensive, updated schema that incorporates the user's requested changes while maintaining the integrity of the existing structure.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      let jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                     generatedText.match(/```\n([\s\S]*?)\n```/) ||
                     [null, generatedText];
      
      let responseJson;
      try {
        responseJson = JSON.parse(jsonMatch[1] || generatedText);
      } catch (parseError) {
        const jsonStart = generatedText.indexOf('{');
        const jsonEnd = generatedText.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          responseJson = JSON.parse(generatedText.substring(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not parse JSON from Gemini response');
        }
      }

      if (!responseJson.schemaName || !responseJson.schemaDescription || !responseJson.fields) {
        throw new Error('Invalid response format from Gemini API');
      }

      // Convert the response to our SchemaField format
      const fields: SchemaField[] = responseJson.fields.map((field: any) => ({
        id: crypto.randomUUID(),
        name: field.name,
        type: field.type,
        required: field.required || false,
        arrayItemType: field.arrayItemType,
        objectFields: field.objectFields?.map((objField: any) => ({
          id: crypto.randomUUID(),
          name: objField.name,
          type: objField.type,
          required: objField.required || false
        }))
      }));

      setUpdatedSchema({
        name: responseJson.schemaName,
        description: responseJson.schemaDescription,
        fields
      });

    } catch (err: any) {
      console.error('Gemini API error:', err);
      setError(`Failed to update schema: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!updatedSchema) return;
    onUpdate(updatedSchema.name, updatedSchema.description, updatedSchema.fields);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'textarea': return '📄';
      case 'number': return '🔢';
      case 'boolean': return '✅';
      case 'date': return '📅';
      case 'email': return '📧';
      case 'url': return '🔗';
      case 'array': return '📋';
      case 'object': return '📦';
      default: return '📝';
    }
  };

  const getFieldChanges = () => {
    if (!updatedSchema) return { added: [], modified: [], removed: [] };

    const currentFieldNames = new Set(currentSchema.fields.map(f => f.name));
    const updatedFieldNames = new Set(updatedSchema.fields.map(f => f.name));

    const added = updatedSchema.fields.filter(f => !currentFieldNames.has(f.name));
    const removed = currentSchema.fields.filter(f => !updatedFieldNames.has(f.name));
    const modified = updatedSchema.fields.filter(f => {
      const currentField = currentSchema.fields.find(cf => cf.name === f.name);
      return currentField && (
        currentField.type !== f.type ||
        currentField.required !== f.required ||
        JSON.stringify(currentField.arrayItemType) !== JSON.stringify(f.arrayItemType) ||
        JSON.stringify(currentField.objectFields) !== JSON.stringify(f.objectFields)
      );
    });

    return { added, modified, removed };
  };

  const changes = getFieldChanges();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Schema Editor</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Modify "{currentSchema.name}" using natural language
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Current Schema Overview */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-4">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Current Schema</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Name:</strong> {currentSchema.name}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Description:</strong> {currentSchema.description || 'No description'}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Fields:</strong> {currentSchema.fields.length} fields
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentSchema.fields.slice(0, 5).map(field => (
                    <span key={field.id} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {field.name}
                    </span>
                  ))}
                  {currentSchema.fields.length > 5 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      +{currentSchema.fields.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* AI Prompt Section */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Wand2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Describe Your Changes</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What changes would you like to make to this schema? *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the modifications you want to make. For example: 'Add social media links and profile picture fields' or 'Include address and contact information' or 'Remove the age field and add birth date instead'"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <button
                onClick={generateWithGemini}
                disabled={loading || !prompt.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Updating Schema with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Update Schema</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Example Prompts */}
          <section className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">Example Modifications</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-600 transition-colors text-sm text-gray-700 dark:text-gray-300 hover:text-orange-700 dark:hover:text-orange-300"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </section>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Updated Schema Display */}
          {updatedSchema && (
            <section className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Updated Schema</h3>
              </div>

              {/* Changes Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {changes.added.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      ✅ Added Fields ({changes.added.length})
                    </h4>
                    <div className="space-y-1">
                      {changes.added.map(field => (
                        <div key={field.id} className="text-sm text-green-800 dark:text-green-200">
                          {getFieldTypeIcon(field.type)} {field.name} ({field.type})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {changes.modified.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                      ✏️ Modified Fields ({changes.modified.length})
                    </h4>
                    <div className="space-y-1">
                      {changes.modified.map(field => (
                        <div key={field.id} className="text-sm text-yellow-800 dark:text-yellow-200">
                          {getFieldTypeIcon(field.type)} {field.name} ({field.type})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {changes.removed.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      ❌ Removed Fields ({changes.removed.length})
                    </h4>
                    <div className="space-y-1">
                      {changes.removed.map(field => (
                        <div key={field.id} className="text-sm text-red-800 dark:text-red-200">
                          {getFieldTypeIcon(field.type)} {field.name} ({field.type})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schema Name
                  </label>
                  <input
                    type="text"
                    value={updatedSchema.name}
                    onChange={(e) => setUpdatedSchema(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={updatedSchema.description}
                    onChange={(e) => setUpdatedSchema(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Updated Schema Fields Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Updated Schema Fields ({updatedSchema.fields.length})
                </h4>
                <div className="space-y-3">
                  {updatedSchema.fields.map((field) => {
                    const isNew = changes.added.some(f => f.name === field.name);
                    const isModified = changes.modified.some(f => f.name === field.name);
                    
                    return (
                      <div 
                        key={field.id} 
                        className={`rounded-lg p-4 border ${
                          isNew ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                          isModified ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                          'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">{field.name}</span>
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                                    Required
                                  </span>
                                )}
                                {isNew && (
                                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                                    New
                                  </span>
                                )}
                                {isModified && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full">
                                    Modified
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{field.type}</span>
                                {field.arrayItemType && (
                                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                                    Array of {field.arrayItemType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Object Fields */}
                        {field.type === 'object' && field.objectFields && field.objectFields.length > 0 && (
                          <div className="mt-3 pl-6 border-l-2 border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Object Properties:</p>
                            <div className="space-y-2">
                              {field.objectFields.map((objField) => (
                                <div key={objField.id} className="flex items-center space-x-2">
                                  <span className="text-sm">{getFieldTypeIcon(objField.type)}</span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{objField.name}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-500">({objField.type})</span>
                                  {objField.required && (
                                    <span className="text-xs text-red-600 dark:text-red-400">*</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Actions */}
          {updatedSchema && (
            <section className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleApplyChanges}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
              >
                <Check className="w-5 h-5" />
                <span>Apply Changes</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};