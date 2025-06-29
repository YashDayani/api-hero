import React, { useState } from 'react';
import { Sparkles, Wand2, X, Check, RefreshCw, AlertCircle, Lightbulb, Code, Edit3 } from 'lucide-react';
import { JsonEditor } from './JsonEditor';
import { validateJson } from '../utils/jsonValidator';

interface AiJsonEditorProps {
  currentTemplate: {
    name: string;
    description: string;
    json_data: any;
  };
  onUpdate: (jsonData: any, name: string, description: string) => void;
  onClose: () => void;
}

export const AiJsonEditor: React.FC<AiJsonEditorProps> = ({
  currentTemplate,
  onUpdate,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [updatedJson, setUpdatedJson] = useState('');
  const [updatedName, setUpdatedName] = useState('');
  const [updatedDescription, setUpdatedDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    "Add social media links and profile picture URL",
    "Include address and contact information",
    "Add pricing, discount, and currency fields",
    "Include timestamps, status, and metadata",
    "Add rating, reviews, and feedback data",
    "Include location, coordinates, and map data",
    "Add permissions, roles, and access levels",
    "Include analytics, metrics, and tracking data",
    "Add file attachments and media URLs",
    "Include workflow, approval, and process status"
  ];

  const generateWithGemini = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the changes you want to make');
      return;
    }

    setLoading(true);
    setError(null);
    setUpdatedJson('');

    try {
      const currentJsonText = JSON.stringify(currentTemplate.json_data, null, 2);

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a JSON template editor. You need to modify an existing JSON template based on the user's request.

Current Template:
Name: ${currentTemplate.name}
Description: ${currentTemplate.description}
JSON Data:
${currentJsonText}

User's Modification Request: "${prompt}"

Instructions:
1. Analyze the current JSON structure and the user's request
2. Make the requested modifications while preserving existing relevant data
3. Add new fields as requested
4. Modify existing fields if needed
5. Remove fields only if explicitly requested
6. Update the template name and description if appropriate
7. Ensure the modified JSON is valid and well-structured
8. Use realistic sample data for new fields
9. Maintain the overall structure and purpose of the template
10. Include proper data types (strings, numbers, booleans, arrays, objects)

Format your response as a JSON object with this exact structure:
{
  "templateName": "Updated Template Name",
  "templateDescription": "Updated description of what this template represents",
  "jsonTemplate": { your updated JSON template here }
}

Make sure the jsonTemplate contains realistic, comprehensive data that incorporates the user's requested changes while maintaining the integrity of the existing structure.`
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

      if (!responseJson.templateName || !responseJson.templateDescription || !responseJson.jsonTemplate) {
        throw new Error('Invalid response format from Gemini API');
      }

      setUpdatedJson(JSON.stringify(responseJson.jsonTemplate, null, 2));
      setUpdatedName(responseJson.templateName);
      setUpdatedDescription(responseJson.templateDescription);

    } catch (err: any) {
      console.error('Gemini API error:', err);
      setError(`Failed to update JSON template: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (!updatedJson) return;
    
    const validation = validateJson(updatedJson);
    if (!validation.isValid) {
      setError('Updated JSON is invalid. Please fix the JSON or try generating again.');
      return;
    }
    
    try {
      const jsonData = JSON.parse(updatedJson);
      onUpdate(jsonData, updatedName, updatedDescription);
    } catch (err) {
      setError('Failed to parse updated JSON. Please try again.');
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const getJsonDiff = () => {
    if (!updatedJson) return null;
    
    try {
      const currentKeys = new Set(Object.keys(currentTemplate.json_data));
      const updatedData = JSON.parse(updatedJson);
      const updatedKeys = new Set(Object.keys(updatedData));
      
      const added = Array.from(updatedKeys).filter(key => !currentKeys.has(key));
      const removed = Array.from(currentKeys).filter(key => !updatedKeys.has(key));
      const modified = Array.from(updatedKeys).filter(key => {
        if (!currentKeys.has(key)) return false;
        return JSON.stringify(currentTemplate.json_data[key]) !== JSON.stringify(updatedData[key]);
      });
      
      return { added, modified, removed };
    } catch {
      return null;
    }
  };

  const diff = getJsonDiff();

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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI JSON Editor</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Modify "{currentTemplate.name}" using natural language
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
          {/* Current Template Overview */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-4">
              <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Current Template</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Name:</strong> {currentTemplate.name}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Description:</strong> {currentTemplate.description || 'No description'}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Fields:</strong> {Object.keys(currentTemplate.json_data).length} top-level fields
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.keys(currentTemplate.json_data).slice(0, 5).map(key => (
                    <span key={key} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {key}
                    </span>
                  ))}
                  {Object.keys(currentTemplate.json_data).length > 5 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      +{Object.keys(currentTemplate.json_data).length - 5} more
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
                  What changes would you like to make to this JSON template? *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the modifications you want to make. For example: 'Add social media links and profile picture URL' or 'Include address and contact information' or 'Remove the age field and add birth date instead'"
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
                    <span>Updating Template with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Update Template</span>
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

          {/* Updated Template Display */}
          {updatedJson && (
            <section className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Updated Template</h3>
              </div>

              {/* Changes Summary */}
              {diff && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {diff.added.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        ✅ Added Fields ({diff.added.length})
                      </h4>
                      <div className="space-y-1">
                        {diff.added.map(field => (
                          <div key={field} className="text-sm text-green-800 dark:text-green-200">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diff.modified.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        ✏️ Modified Fields ({diff.modified.length})
                      </h4>
                      <div className="space-y-1">
                        {diff.modified.map(field => (
                          <div key={field} className="text-sm text-yellow-800 dark:text-yellow-200">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diff.removed.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                        ❌ Removed Fields ({diff.removed.length})
                      </h4>
                      <div className="space-y-1">
                        {diff.removed.map(field => (
                          <div key={field} className="text-sm text-red-800 dark:text-red-200">
                            {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={updatedName}
                    onChange={(e) => setUpdatedName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={updatedDescription}
                    onChange={(e) => setUpdatedDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <JsonEditor
                value={updatedJson}
                onChange={setUpdatedJson}
                placeholder=""
              />
            </section>
          )}

          {/* Actions */}
          {updatedJson && (
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