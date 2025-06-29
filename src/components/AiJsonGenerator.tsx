import React, { useState } from 'react';
import { Sparkles, Wand2, X, Copy, Check, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react';
import { JsonEditor } from './JsonEditor';
import { validateJson } from '../utils/jsonValidator';

interface AiJsonGeneratorProps {
  onGenerate: (jsonData: any, name: string, description: string) => void;
  onClose: () => void;
}

export const AiJsonGenerator: React.FC<AiJsonGeneratorProps> = ({
  onGenerate,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedJson, setGeneratedJson] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const examplePrompts = [
    "User profile with name, email, avatar, and preferences",
    "E-commerce product with title, price, description, images, and reviews",
    "Blog post with title, content, author, tags, and metadata",
    "Restaurant menu item with name, price, ingredients, and nutritional info",
    "Social media post with content, author, likes, comments, and timestamp",
    "Event details with title, date, location, description, and attendees",
    "Task management item with title, description, priority, and due date",
    "Movie information with title, director, cast, genre, and ratings",
    "Book details with title, author, ISBN, genre, and publication info",
    "Weather forecast with temperature, conditions, humidity, and location"
  ];

  const generateWithGemini = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your JSON template');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedJson('');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a JSON template generator. Create a comprehensive, realistic JSON template based on the user's description. 

User Request: "${prompt}"

Requirements:
1. Generate a complete, realistic JSON structure that matches the description
2. Include meaningful sample data (not just placeholders)
3. Use realistic field names and values
4. Include nested objects and arrays where appropriate
5. Add relevant metadata fields (id, timestamps, etc.)
6. Make it production-ready and comprehensive
7. Ensure all string values are realistic (use real-looking names, emails, URLs, etc.)
8. Include 3-8 main fields with appropriate sub-fields
9. Use proper data types (strings, numbers, booleans, arrays, objects)

Also provide:
- A suitable template name (2-4 words, descriptive)
- A brief description (1-2 sentences explaining what this template represents)

Format your response as a JSON object with this exact structure:
{
  "templateName": "Your Template Name",
  "templateDescription": "Brief description of what this template represents",
  "jsonTemplate": { your actual JSON template here }
}

Make sure the jsonTemplate contains realistic, comprehensive data that would be useful in a real application.`
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
      
      // Extract JSON from the response (handle potential markdown formatting)
      let jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                     generatedText.match(/```\n([\s\S]*?)\n```/) ||
                     [null, generatedText];
      
      let responseJson;
      try {
        responseJson = JSON.parse(jsonMatch[1] || generatedText);
      } catch (parseError) {
        // If parsing fails, try to extract just the JSON part
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

      setGeneratedJson(JSON.stringify(responseJson.jsonTemplate, null, 2));
      setTemplateName(responseJson.templateName);
      setTemplateDescription(responseJson.templateDescription);

    } catch (err: any) {
      console.error('Gemini API error:', err);
      setError(`Failed to generate JSON template: ${err.message}`);
      
      // Fallback to a basic template if API fails
      const fallbackTemplate = generateFallbackTemplate(prompt);
      setGeneratedJson(JSON.stringify(fallbackTemplate.json, null, 2));
      setTemplateName(fallbackTemplate.name);
      setTemplateDescription(fallbackTemplate.description);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackTemplate = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('user') || lowerPrompt.includes('profile')) {
      return {
        name: 'User Profile Template',
        description: 'Complete user profile with personal information and preferences',
        json: {
          id: 1,
          name: "John Doe",
          email: "john.doe@example.com",
          avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
          bio: "Software developer passionate about creating amazing user experiences",
          location: "San Francisco, CA",
          website: "https://johndoe.dev",
          social: {
            twitter: "@johndoe",
            linkedin: "linkedin.com/in/johndoe",
            github: "github.com/johndoe"
          },
          preferences: {
            theme: "dark",
            notifications: true,
            language: "en"
          },
          stats: {
            followers: 1250,
            following: 890,
            posts: 156
          },
          joinedAt: "2023-01-15T10:30:00Z",
          isVerified: true,
          isActive: true
        }
      };
    }
    
    // Default fallback
    return {
      name: 'Custom Data Template',
      description: 'AI-generated template based on your description',
      json: {
        id: 1,
        title: "Sample Data",
        description: "This is a sample template generated based on your prompt",
        data: {
          field1: "value1",
          field2: "value2",
          field3: 123
        },
        metadata: {
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
          version: "1.0"
        },
        status: "active"
      }
    };
  };

  const handleCopyJson = async () => {
    if (generatedJson) {
      await navigator.clipboard.writeText(generatedJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUseTemplate = () => {
    if (!generatedJson) return;
    
    const validation = validateJson(generatedJson);
    if (!validation.isValid) {
      setError('Generated JSON is invalid. Please try generating again.');
      return;
    }
    
    try {
      const jsonData = JSON.parse(generatedJson);
      onGenerate(jsonData, templateName, templateDescription);
    } catch (err) {
      setError('Failed to parse generated JSON. Please try again.');
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI JSON Generator</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Powered by Gemini Flash 2.0 - Generate JSON templates from natural language
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Describe Your JSON Template</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What kind of data structure do you need? *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the JSON structure you want to create. For example: 'A user profile with name, email, avatar, social links, and preferences' or 'An e-commerce product with title, price, images, and reviews'"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={generateWithGemini}
                  disabled={loading || !prompt.trim()}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate JSON Template</span>
                    </>
                  )}
                </button>

                {generatedJson && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{copied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                )}
              </div>
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

          {/* Generated JSON Display */}
          {generatedJson && (
            <section className="space-y-6">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Template</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <JsonEditor
                value={generatedJson}
                onChange={setGeneratedJson}
                placeholder=""
              />
            </section>
          )}

          {/* Actions */}
          {generatedJson && (
            <section className="flex space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleUseTemplate}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
              >
                <Check className="w-5 h-5" />
                <span>Use This Template</span>
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