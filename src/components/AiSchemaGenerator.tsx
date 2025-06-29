import React, { useState } from 'react';
import { Sparkles, Wand2, X, Check, RefreshCw, AlertCircle, Lightbulb, Database } from 'lucide-react';
import { SchemaField } from '../hooks/useSchemas';

interface AiSchemaGeneratorProps {
  onGenerate: (name: string, description: string, fields: SchemaField[]) => void;
  onClose: () => void;
}

export const AiSchemaGenerator: React.FC<AiSchemaGeneratorProps> = ({
  onGenerate,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState<{
    name: string;
    description: string;
    fields: SchemaField[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    "User profile with personal info, contact details, and preferences",
    "E-commerce product with details, pricing, inventory, and reviews",
    "Blog post with content, author info, SEO metadata, and engagement",
    "Event management with details, location, attendees, and schedule",
    "Task management with priority, status, assignee, and deadlines",
    "Restaurant menu item with ingredients, nutrition, and allergens",
    "Real estate property with location, features, and pricing",
    "Employee record with personal info, role, and performance data",
    "Course curriculum with lessons, assignments, and progress tracking",
    "Social media post with content, engagement metrics, and metadata"
  ];

  const generateWithGemini = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your schema');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedSchema(null);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a database schema generator. Create a comprehensive database schema based on the user's description.

User Request: "${prompt}"

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

Requirements:
1. Generate 5-12 relevant fields that match the description
2. Use appropriate field types for each field
3. Mark important fields as required
4. For array fields, specify the arrayItemType (text, number, url, or object)
5. For object fields, include 2-5 objectFields with their own types
6. Use realistic field names (snake_case or camelCase)
7. Create a logical, well-structured schema
8. Include both basic and advanced fields
9. Consider real-world use cases

Format your response as a JSON object with this exact structure:
{
  "schemaName": "Your Schema Name",
  "schemaDescription": "Brief description of what this schema represents",
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

Make sure to create a comprehensive, production-ready schema that would be useful in a real application.`
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
      const fields: SchemaField[] = responseJson.fields.map((field: any, index: number) => ({
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

      setGeneratedSchema({
        name: responseJson.schemaName,
        description: responseJson.schemaDescription,
        fields
      });

    } catch (err: any) {
      console.error('Gemini API error:', err);
      setError(`Failed to generate schema: ${err.message}`);
      
      // Fallback to a basic schema if API fails
      const fallbackSchema = generateFallbackSchema(prompt);
      setGeneratedSchema(fallbackSchema);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSchema = (prompt: string): { name: string; description: string; fields: SchemaField[] } => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('user') || lowerPrompt.includes('profile')) {
      return {
        name: 'User Profile Schema',
        description: 'Complete user profile with personal information and preferences',
        fields: [
          { id: crypto.randomUUID(), name: 'name', type: 'text', required: true },
          { id: crypto.randomUUID(), name: 'email', type: 'email', required: true },
          { id: crypto.randomUUID(), name: 'avatar', type: 'url', required: false },
          { id: crypto.randomUUID(), name: 'bio', type: 'textarea', required: false },
          { id: crypto.randomUUID(), name: 'age', type: 'number', required: false },
          { id: crypto.randomUUID(), name: 'is_verified', type: 'boolean', required: false },
          { id: crypto.randomUUID(), name: 'join_date', type: 'date', required: true },
          { 
            id: crypto.randomUUID(), 
            name: 'social_links', 
            type: 'array', 
            required: false,
            arrayItemType: 'url'
          }
        ]
      };
    }
    
    if (lowerPrompt.includes('product') || lowerPrompt.includes('ecommerce')) {
      return {
        name: 'Product Schema',
        description: 'E-commerce product with details and pricing',
        fields: [
          { id: crypto.randomUUID(), name: 'title', type: 'text', required: true },
          { id: crypto.randomUUID(), name: 'description', type: 'textarea', required: true },
          { id: crypto.randomUUID(), name: 'price', type: 'number', required: true },
          { id: crypto.randomUUID(), name: 'sku', type: 'text', required: true },
          { id: crypto.randomUUID(), name: 'in_stock', type: 'boolean', required: true },
          { id: crypto.randomUUID(), name: 'category', type: 'text', required: true },
          { 
            id: crypto.randomUUID(), 
            name: 'images', 
            type: 'array', 
            required: false,
            arrayItemType: 'url'
          },
          { 
            id: crypto.randomUUID(), 
            name: 'specifications', 
            type: 'object', 
            required: false,
            objectFields: [
              { id: crypto.randomUUID(), name: 'weight', type: 'text', required: false },
              { id: crypto.randomUUID(), name: 'dimensions', type: 'text', required: false },
              { id: crypto.randomUUID(), name: 'material', type: 'text', required: false }
            ]
          }
        ]
      };
    }
    
    // Default fallback
    return {
      name: 'Custom Data Schema',
      description: 'AI-generated schema based on your description',
      fields: [
        { id: crypto.randomUUID(), name: 'title', type: 'text', required: true },
        { id: crypto.randomUUID(), name: 'description', type: 'textarea', required: false },
        { id: crypto.randomUUID(), name: 'status', type: 'text', required: true },
        { id: crypto.randomUUID(), name: 'created_date', type: 'date', required: true },
        { id: crypto.randomUUID(), name: 'is_active', type: 'boolean', required: false }
      ]
    };
  };

  const handleUseSchema = () => {
    if (!generatedSchema) return;
    onGenerate(generatedSchema.name, generatedSchema.description, generatedSchema.fields);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Schema Generator</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Powered by Gemini Flash 2.0 - Generate database schemas from natural language
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
          {/* AI Prompt Section */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Describe Your Data Schema</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What kind of data structure do you need? *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the data schema you want to create. For example: 'A user profile with personal information, contact details, and preferences' or 'An e-commerce product with pricing, inventory, and specifications'"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <button
                onClick={generateWithGemini}
                disabled={loading || !prompt.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating Schema with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Schema</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Example Prompts */}
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Example Prompts</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-left p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300"
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

          {/* Generated Schema Display */}
          {generatedSchema && (
            <section className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Schema</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schema Name
                  </label>
                  <input
                    type="text"
                    value={generatedSchema.name}
                    onChange={(e) => setGeneratedSchema(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={generatedSchema.description}
                    onChange={(e) => setGeneratedSchema(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Schema Fields Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Schema Fields ({generatedSchema.fields.length})
                </h4>
                <div className="space-y-3">
                  {generatedSchema.fields.map((field, index) => (
                    <div key={field.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
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
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Actions */}
          {generatedSchema && (
            <section className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleUseSchema}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
              >
                <Check className="w-5 h-5" />
                <span>Use This Schema</span>
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