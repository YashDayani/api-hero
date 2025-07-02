import React, { useState } from 'react';
import { ApiEndpoint } from '../hooks/useApis';
import { Book, Code, Download, ExternalLink, Copy, Check, Sparkles, FileText, Globe, Settings, RefreshCw, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDirectApiUrl } from '../lib/directApi';

interface DocumentationGeneratorProps {
  apis: ApiEndpoint[];
  projectName: string;
  onClose: () => void;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

export const DocumentationGenerator: React.FC<DocumentationGeneratorProps> = ({
  apis,
  projectName,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'interactive' | 'openapi' | 'markdown'>('interactive');
  const [openApiSpec, setOpenApiSpec] = useState<OpenAPISpec | null>(null);
  const [markdownDoc, setMarkdownDoc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateOpenAPISpec = async () => {
    setGenerating(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const prompt = `Generate a comprehensive OpenAPI 3.0 specification for the following APIs:

Project: ${projectName}
APIs:
${apis.map(api => `
- ${api.name}
  Route: ${api.route}
  Description: ${api.description || 'No description'}
  Public: ${api.is_public ? 'Yes' : 'No (requires API key)'}
  Data Type: ${api.data_type}
  Sample Response: ${JSON.stringify(api.json_data, null, 2)}
  URL: ${api.is_public ? getDirectApiUrl(api.route, api.data_type as 'template' | 'schema') : `${supabaseUrl}/functions/v1/api-proxy${api.route}`}
`).join('\n')}

Requirements:
1. Create a complete OpenAPI 3.0 specification
2. Include proper schemas for all response types
3. For public APIs, use the direct REST URL format: ${supabaseUrl}/rest/v1/public_api_endpoints?route=eq.ROUTE&select=response_data
4. For private APIs, add security schemes for API key authentication via x-api-key header
5. Include detailed descriptions and examples
6. Add proper error responses (400, 401, 404, 500)
7. Use realistic and comprehensive examples
8. Include proper data types and validation rules

Format the response as a valid JSON object that can be used with Swagger UI.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      let jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                     generatedText.match(/```\n([\s\S]*?)\n```/) ||
                     [null, generatedText];
      
      let spec;
      try {
        spec = JSON.parse(jsonMatch[1] || generatedText);
      } catch (parseError) {
        const jsonStart = generatedText.indexOf('{');
        const jsonEnd = generatedText.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          spec = JSON.parse(generatedText.substring(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not parse OpenAPI specification from response');
        }
      }

      setOpenApiSpec(spec);
      toast.success('OpenAPI specification generated successfully!');
    } catch (error: any) {
      console.error('Error generating OpenAPI spec:', error);
      toast.error('Failed to generate OpenAPI specification');
      
      // Fallback to basic spec generation
      generateBasicOpenAPISpec();
    } finally {
      setGenerating(false);
    }
  };

  const generateBasicOpenAPISpec = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const spec: OpenAPISpec = {
      openapi: "3.0.0",
      info: {
        title: `${projectName} API`,
        description: `Auto-generated API documentation for ${projectName}`,
        version: "1.0.0"
      },
      servers: [
        {
          url: `${supabaseUrl}/rest/v1`,
          description: "Direct REST API (public endpoints)"
        },
        {
          url: `${supabaseUrl}/functions/v1/api-proxy`,
          description: "Edge Function API (all endpoints)"
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          ApiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "x-api-key"
          },
          SupabaseKeyAuth: {
            type: "apiKey",
            in: "query",
            name: "apikey"
          }
        }
      }
    };

    apis.forEach(api => {
      const pathKey = api.route;
      
      if (api.is_public) {
        // Direct REST API for public endpoints
        const restPath = `/public_api_${api.data_type === 'schema' ? 'data' : 'endpoints'}?route=eq.${pathKey.replace(/^\//, '')}&select=response_data`;
        
        spec.paths[restPath] = {
          get: {
            summary: `${api.name} (Direct REST)`,
            description: api.description || `Direct REST access to ${api.name}`,
            security: [{ SupabaseKeyAuth: [] }],
            responses: {
              "200": {
                description: "Successful response",
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          response_data: {
                            type: "object",
                            example: api.json_data
                          }
                        }
                      }
                    }
                  }
                }
              },
              "404": {
                description: "API endpoint not found"
              },
              "500": {
                description: "Internal server error"
              }
            }
          }
        };
      }
      
      // Edge Function path (works for all endpoints)
      spec.paths[pathKey] = {
        get: {
          summary: api.name,
          description: api.description || `Returns data from ${api.name}`,
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    example: api.json_data
                  }
                }
              }
            },
            "404": {
              description: "API endpoint not found"
            },
            "500": {
              description: "Internal server error"
            }
          }
        }
      };

      if (!api.is_public) {
        spec.paths[pathKey].get.security = [{ ApiKeyAuth: [] }];
        spec.paths[pathKey].get.responses["401"] = {
          description: "Missing or invalid API key"
        };
      }
    });

    setOpenApiSpec(spec);
  };

  const generateMarkdownDoc = async () => {
    setGenerating(true);
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const prompt = `Generate comprehensive Markdown documentation for the following API project:

Project: ${projectName}
APIs:
${apis.map(api => `
- ${api.name}
  Route: ${api.route}
  Description: ${api.description || 'No description'}
  Public: ${api.is_public ? 'Yes' : 'No (requires API key)'}
  Data Type: ${api.data_type}
  Direct REST URL: ${api.is_public ? getDirectApiUrl(api.route, api.data_type as 'template' | 'schema') : 'N/A (private endpoint)'}
  Edge Function URL: ${`${supabaseUrl}/functions/v1/api-proxy${api.route}`}
  Sample Response: ${JSON.stringify(api.json_data, null, 2)}
`).join('\n')}

Requirements:
1. Create a professional README-style documentation
2. Include a table of contents
3. Add installation/setup instructions
4. Document each endpoint with:
   - Description
   - HTTP method and URL
   - Direct REST API URL for public endpoints (emphasize this as the FAST option)
   - Edge Function URL as fallback for private endpoints
   - Authentication requirements
   - Response format with examples
   - Error codes and messages
5. Include code examples in multiple languages (curl, JavaScript, Python)
   - For public endpoints, show the fast direct API usage
   - For private endpoints, show the edge function approach
6. Add rate limiting and best practices sections
7. Include troubleshooting and FAQ sections
8. Emphasize the performance benefits of using Direct REST API (~50-100ms) vs Edge Functions (~1-5s)

Format as clean, well-structured Markdown that's ready for GitHub or documentation sites.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyAg7W0RkpIoOZCHSMW0uc8qnxQa3BnpU7E`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Clean up the markdown
      let markdown = generatedText;
      if (markdown.includes('```markdown')) {
        const match = markdown.match(/```markdown\n([\s\S]*?)\n```/);
        if (match) {
          markdown = match[1];
        }
      }
      
      setMarkdownDoc(markdown);
      toast.success('Markdown documentation generated successfully!');
    } catch (error: any) {
      console.error('Error generating markdown:', error);
      toast.error('Failed to generate markdown documentation');
      
      // Fallback to basic markdown
      generateBasicMarkdown();
    } finally {
      setGenerating(false);
    }
  };

  const generateBasicMarkdown = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const markdown = `# ${projectName} API Documentation

## Overview

This is the API documentation for ${projectName}. The API provides ${apis.length} endpoint${apis.length !== 1 ? 's' : ''} for accessing data.

## Access Methods

For optimal performance, we provide two ways to access the API:

1. **Direct REST API** (Public endpoints only)
   - **Response time:** ~50-100ms
   - **URL format:** \`${supabaseUrl}/rest/v1/public_api_endpoints?route=eq.{route}&select=response_data\`
   - No authentication headers required for public endpoints

2. **Edge Function API** (All endpoints)
   - **Response time:** ~1-5s
   - **URL format:** \`${supabaseUrl}/functions/v1/api-proxy{route}\`
   - Requires API key for private endpoints

**💡 Performance Tip:** Always use the Direct REST API for public endpoints when possible!

## Endpoints

${apis.map(api => `
### ${api.name}

**Route:** \`${api.route}\`

**Description:** ${api.description || 'No description provided'}

**Access Type:** ${api.is_public ? '✅ Public' : '🔒 Private (API key required)'}

**Data Type:** ${api.data_type === 'schema' ? 'Schema-based (dynamic data)' : 'Template-based'}

${api.is_public ? `**⚡ Fast Direct REST URL:**
\`\`\`
${getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}
\`\`\`` : ''}

**Edge Function URL:**
\`\`\`
${supabaseUrl}/functions/v1/api-proxy${api.route}
\`\`\`

**Response Example:**
\`\`\`json
${JSON.stringify(api.json_data, null, 2)}
\`\`\`

**Example Usage:**

*cURL:*
\`\`\`bash
${api.is_public ?
  `# Fast Direct REST API (50-100ms)
curl -X GET "${getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}"` :
  `# Edge Function API
curl -X GET "${supabaseUrl}/functions/v1/api-proxy${api.route}" \\
  -H "x-api-key: YOUR_API_KEY"`
}
\`\`\`

*JavaScript:*
\`\`\`javascript
${api.is_public ?
  `// Fast Direct REST API (50-100ms)
const response = await fetch('${getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}');
const result = await response.json();
const data = result.response_data; // Note: result is an array with a single object containing response_data` :
  `// Edge Function API
const response = await fetch('${supabaseUrl}/functions/v1/api-proxy${api.route}', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
});
const data = await response.json();`}
console.log(data);
\`\`\`
`).join('\n')}

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 401  | Unauthorized (invalid API key) |
| 404  | Endpoint not found |
| 500  | Internal server error |

## Performance Considerations

- **Direct REST API** (50-100ms): Always use for public endpoints
- **Edge Function API** (1-5s): Use for private endpoints requiring authentication

## Support

For support and questions, please contact the API team.
`;

    setMarkdownDoc(markdown);
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const openSwaggerUI = () => {
    if (!openApiSpec) return;
    
    const specString = JSON.stringify(openApiSpec, null, 2);
    const encodedSpec = encodeURIComponent(specString);
    const swaggerUrl = `https://petstore.swagger.io/?url=data:application/json,${encodedSpec}`;
    
    window.open(swaggerUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Auto-generate beautiful docs for {projectName}
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

        {/* Tabs */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex space-x-0">
            <button
              onClick={() => setActiveTab('interactive')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'interactive'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Interactive Docs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('openapi')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'openapi'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>OpenAPI Spec</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'markdown'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Markdown</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Interactive Documentation */}
          {activeTab === 'interactive' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 mb-6">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Performance Tip: Direct REST API</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Public endpoints can be accessed directly via Supabase REST API for significantly faster response times (~50-100ms vs 1-5s for edge functions).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {apis.map((api) => (
                  <div key={api.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
                            GET
                          </span>
                          <code className="text-lg font-mono text-gray-900 dark:text-white">
                            {api.route}
                          </code>
                          {!api.is_public && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded text-xs">
                              Private
                            </span>
                          )}
                          {api.is_public && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs flex items-center space-x-1">
                              <Zap className="w-3 h-3" />
                              <span>Fast API</span>
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const url = api.is_public 
                              ? getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')
                              : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy${api.route}`;
                            window.open(url, '_blank');
                          }}
                          className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Try it</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {api.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {api.description || 'No description provided'}
                        </p>
                      </div>

                      {api.is_public && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2 mb-1">
                            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Direct REST API URL (Fast ~50-100ms):</h5>
                          </div>
                          <code className="bg-white dark:bg-gray-800 p-2 rounded text-xs font-mono text-blue-800 dark:text-blue-300 block overflow-x-auto">
                            {getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}
                          </code>
                        </div>
                      )}

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {api.is_public ? "Edge Function URL (Alternative):" : "API URL:"}
                        </h5>
                        <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono block overflow-x-auto text-gray-800 dark:text-gray-300">
                          {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy${api.route}`}
                        </code>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Response Example:
                        </h5>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            {JSON.stringify(api.json_data, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {api.is_public ? (
                          <>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Direct REST API (Fast):
                              </h5>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                  curl -X GET "{getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}"
                                </code>
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                JavaScript Example (Fast):
                              </h5>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                  {`// ~50-100ms response time
fetch('${getDirectApiUrl(api.route, api.data_type as 'template' | 'schema')}')
  .then(res => res.json())
  .then(data => console.log(data.response_data))`}
                                </code>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                cURL Example:
                              </h5>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                  curl -X GET "{import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy{api.route}"
                                  {!api.is_public && ' \\\n  -H "x-api-key: YOUR_API_KEY"'}
                                </code>
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                JavaScript Example:
                              </h5>
                              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                                <code className="text-sm text-gray-800 dark:text-gray-200">
                                  {`fetch('${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy${api.route}'${!api.is_public ? `, {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
}` : ''})`}
                                </code>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OpenAPI Specification */}
          {activeTab === 'openapi' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    OpenAPI 3.0 Specification
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Machine-readable API specification for tools like Swagger UI
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {!openApiSpec && (
                    <button
                      onClick={generateOpenAPISpec}
                      disabled={generating}
                      className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                      {generating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{generating ? 'Generating...' : 'Generate with AI'}</span>
                    </button>
                  )}
                  
                  {openApiSpec && (
                    <>
                      <button
                        onClick={openSwaggerUI}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in Swagger UI</span>
                      </button>
                      <button
                        onClick={() => handleCopy(JSON.stringify(openApiSpec, null, 2))}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleDownload(
                          JSON.stringify(openApiSpec, null, 2),
                          `${projectName.toLowerCase().replace(/\s+/g, '-')}-openapi.json`,
                          'application/json'
                        )}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {openApiSpec ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                      {JSON.stringify(openApiSpec, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Generate OpenAPI Specification
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a machine-readable API specification that can be used with Swagger UI and other tools
                  </p>
                  <button
                    onClick={generateOpenAPISpec}
                    disabled={generating}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {generating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <span>{generating ? 'Generating with AI...' : 'Generate with AI'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Markdown Documentation */}
          {activeTab === 'markdown' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Markdown Documentation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Human-readable documentation perfect for GitHub and documentation sites
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {!markdownDoc && (
                    <button
                      onClick={generateMarkdownDoc}
                      disabled={generating}
                      className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
                    >
                      {generating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{generating ? 'Generating...' : 'Generate with AI'}</span>
                    </button>
                  )}
                  
                  {markdownDoc && (
                    <>
                      <button
                        onClick={() => handleCopy(markdownDoc)}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleDownload(
                          markdownDoc,
                          `${projectName.toLowerCase().replace(/\s+/g, '-')}-api-docs.md`,
                          'text/markdown'
                        )}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {markdownDoc ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="p-4">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                      {markdownDoc}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Generate Markdown Documentation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create comprehensive documentation in Markdown format, perfect for README files and documentation sites
                  </p>
                  <button
                    onClick={generateMarkdownDoc}
                    disabled={generating}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50"
                  >
                    {generating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <span>{generating ? 'Generating with AI...' : 'Generate with AI'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};