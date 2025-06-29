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
    "Event details with title, date, location, description, and attendees"
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
      // In a real implementation, you would call the Gemini API
      // For now, we'll simulate the API call with a timeout and generate realistic JSON
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate Gemini API response based on the prompt
      const simulatedResponse = generateSimulatedJson(prompt);
      
      setGeneratedJson(JSON.stringify(simulatedResponse.json, null, 2));
      setTemplateName(simulatedResponse.name);
      setTemplateDescription(simulatedResponse.description);
    } catch (err) {
      setError('Failed to generate JSON template. Please try again.');
      console.error('Gemini API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSimulatedJson = (prompt: string) => {
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
    
    if (lowerPrompt.includes('product') || lowerPrompt.includes('ecommerce') || lowerPrompt.includes('shop')) {
      return {
        name: 'E-commerce Product Template',
        description: 'Complete product information for online store',
        json: {
          id: 101,
          title: "Premium Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation and premium sound quality",
          price: 299.99,
          originalPrice: 399.99,
          discount: 25,
          currency: "USD",
          category: "Electronics",
          subcategory: "Audio",
          brand: "AudioTech",
          sku: "AT-WH-001",
          images: [
            "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg",
            "https://images.pexels.com/photos/3394651/pexels-photo-3394651.jpeg"
          ],
          features: [
            "Active Noise Cancellation",
            "30-hour battery life",
            "Bluetooth 5.0",
            "Quick charge technology"
          ],
          specifications: {
            weight: "250g",
            dimensions: "18 x 15 x 7 cm",
            batteryLife: "30 hours",
            chargingTime: "2 hours",
            connectivity: "Bluetooth 5.0, USB-C"
          },
          rating: 4.8,
          reviewCount: 1247,
          inStock: true,
          stockQuantity: 45,
          shipping: {
            free: true,
            estimatedDays: "2-3"
          },
          tags: ["wireless", "headphones", "noise-cancelling", "premium"]
        }
      };
    }
    
    if (lowerPrompt.includes('blog') || lowerPrompt.includes('post') || lowerPrompt.includes('article')) {
      return {
        name: 'Blog Post Template',
        description: 'Complete blog post with metadata and content structure',
        json: {
          id: 42,
          title: "The Future of Web Development: Trends to Watch in 2024",
          slug: "future-web-development-trends-2024",
          excerpt: "Explore the latest trends shaping the future of web development, from AI integration to new frameworks.",
          content: "Web development continues to evolve at a rapid pace. In this comprehensive guide, we'll explore the key trends that are shaping the industry...",
          author: {
            id: 5,
            name: "Sarah Johnson",
            avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
            bio: "Senior Frontend Developer and Tech Writer",
            social: {
              twitter: "@sarahdev",
              linkedin: "linkedin.com/in/sarahjohnson"
            }
          },
          publishedAt: "2024-01-15T09:00:00Z",
          updatedAt: "2024-01-15T09:00:00Z",
          status: "published",
          featured: true,
          featuredImage: "https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg",
          tags: ["web development", "trends", "technology", "frontend"],
          category: "Technology",
          readingTime: 8,
          views: 2847,
          likes: 156,
          comments: 23,
          seo: {
            metaTitle: "Future of Web Development: 2024 Trends | TechBlog",
            metaDescription: "Discover the latest web development trends for 2024. Learn about AI integration, new frameworks, and emerging technologies.",
            keywords: ["web development", "2024 trends", "frontend", "technology"]
          }
        }
      };
    }
    
    if (lowerPrompt.includes('restaurant') || lowerPrompt.includes('menu') || lowerPrompt.includes('food')) {
      return {
        name: 'Restaurant Menu Item Template',
        description: 'Complete menu item with nutritional information and details',
        json: {
          id: 15,
          name: "Grilled Salmon with Quinoa",
          description: "Fresh Atlantic salmon grilled to perfection, served with organic quinoa and seasonal vegetables",
          price: 28.50,
          currency: "USD",
          category: "Main Course",
          subcategory: "Seafood",
          image: "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg",
          ingredients: [
            "Fresh Atlantic Salmon (6oz)",
            "Organic Quinoa",
            "Seasonal Vegetables",
            "Lemon Herb Sauce",
            "Fresh Herbs"
          ],
          allergens: ["Fish"],
          dietary: ["Gluten-Free", "High-Protein", "Omega-3 Rich"],
          nutrition: {
            calories: 485,
            protein: "42g",
            carbs: "28g",
            fat: "22g",
            fiber: "4g",
            sodium: "320mg"
          },
          preparationTime: 18,
          spiceLevel: "Mild",
          chef: "Chef Maria Rodriguez",
          available: true,
          popular: true,
          rating: 4.9,
          reviewCount: 89,
          tags: ["healthy", "seafood", "gluten-free", "signature"]
        }
      };
    }
    
    if (lowerPrompt.includes('event') || lowerPrompt.includes('meeting') || lowerPrompt.includes('conference')) {
      return {
        name: 'Event Details Template',
        description: 'Complete event information with attendees and logistics',
        json: {
          id: 78,
          title: "Tech Innovation Summit 2024",
          description: "Join industry leaders for a day of innovation, networking, and insights into the future of technology",
          type: "Conference",
          category: "Technology",
          startDate: "2024-03-15T09:00:00Z",
          endDate: "2024-03-15T18:00:00Z",
          timezone: "PST",
          location: {
            venue: "San Francisco Convention Center",
            address: "747 Howard St, San Francisco, CA 94103",
            city: "San Francisco",
            state: "California",
            country: "USA",
            coordinates: {
              lat: 37.7849,
              lng: -122.4094
            }
          },
          organizer: {
            name: "TechEvents Inc.",
            email: "info@techevents.com",
            phone: "+1-555-0123",
            website: "https://techevents.com"
          },
          speakers: [
            {
              name: "Dr. Emily Chen",
              title: "AI Research Director",
              company: "FutureTech Labs",
              bio: "Leading expert in artificial intelligence and machine learning",
              image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg"
            }
          ],
          agenda: [
            {
              time: "09:00",
              title: "Registration & Welcome Coffee",
              duration: 60
            },
            {
              time: "10:00",
              title: "Keynote: The Future of AI",
              speaker: "Dr. Emily Chen",
              duration: 45
            }
          ],
          pricing: {
            earlyBird: 299,
            regular: 399,
            student: 99,
            currency: "USD"
          },
          capacity: 500,
          registered: 387,
          available: 113,
          tags: ["technology", "AI", "innovation", "networking"],
          featured: true,
          status: "open"
        }
      };
    }
    
    // Default generic template
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