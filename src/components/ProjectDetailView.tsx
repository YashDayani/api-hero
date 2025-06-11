import React, { useState } from 'react';
import { Project } from '../hooks/useProjects';
import { useApis } from '../hooks/useApis';
import { useSchemas } from '../hooks/useSchemas';
import { useJsonTemplates } from '../hooks/useJsonTemplates';
import { useAuth } from '../hooks/useAuth';
import { ApiCard } from './ApiCard';
import { ApiForm } from './ApiForm';
import { ApiTester } from './ApiTester';
import { SchemaBuilder } from './SchemaBuilder';
import { JsonTemplateBuilder } from './JsonTemplateBuilder';
import { JsonTemplateEditor } from './JsonTemplateEditor';
import { DataManager } from './DataManager';
import { ProfileMenu } from './ProfileMenu';
import { Plus, ArrowLeft, Globe, FolderOpen, Database, Code, Edit2, Trash2, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
}) => {
  const { user, isSchemaMode } = useAuth();
  const { addApi, updateApi, deleteApi, regenerateApiKey, getApisByProjectId } = useApis();
  const { addSchema, deleteSchema, getSchemasByProjectId } = useSchemas();
  const { addTemplate, updateTemplate, deleteTemplate, getTemplatesByProjectId } = useJsonTemplates();

  const apis = getApisByProjectId(project.id);
  const schemas = getSchemasByProjectId(project.id);
  const templates = getTemplatesByProjectId(project.id);
  
  const [showApiForm, setShowApiForm] = useState(false);
  const [showSchemaBuilder, setShowSchemaBuilder] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingApi, setEditingApi] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [testingApi, setTestingApi] = useState<any>(null);
  const [managingSchema, setManagingSchema] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'apis' | 'schemas' | 'templates'>('apis');
  const [deletingSchemaId, setDeletingSchemaId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const handleCreateNewApi = () => {
    setEditingApi(null);
    setShowApiForm(true);
  };

  const handleCreateNewSchema = () => {
    setShowSchemaBuilder(true);
  };

  const handleCreateNewTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateBuilder(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateBuilder(true);
  };

  const handleEdit = (api: any) => {
    setEditingApi(api);
    setShowApiForm(true);
  };

  const handleSaveApi = async (apiData: any) => {
    let success = false;
    
    if (editingApi) {
      success = await updateApi(editingApi.id, apiData);
      if (success) {
        toast.success('API updated successfully!');
      }
    } else {
      const newApi = await addApi(apiData);
      success = !!newApi;
      if (success) {
        toast.success('API created successfully!');
      }
    }
    
    if (success) {
      setShowApiForm(false);
      setEditingApi(null);
    }
  };

  const handleSaveSchema = async (schemaData: any) => {
    const newSchema = await addSchema({
      ...schemaData,
      project_id: project.id,
    });
    if (newSchema) {
      toast.success('Schema created successfully!');
      setShowSchemaBuilder(false);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    let success = false;
    
    if (editingTemplate) {
      success = await updateTemplate(editingTemplate.id, templateData);
      if (success) {
        toast.success('JSON template updated successfully!');
      }
    } else {
      const newTemplate = await addTemplate({
        ...templateData,
        project_id: project.id,
      });
      success = !!newTemplate;
      if (success) {
        toast.success('JSON template created successfully!');
      }
    }
    
    if (success) {
      setShowTemplateBuilder(false);
      setEditingTemplate(null);
    }
  };

  const handleDeleteApi = async (id: string) => {
    await deleteApi(id);
  };

  const handleDeleteSchema = async (id: string) => {
    const success = await deleteSchema(id);
    if (success) {
      setDeletingSchemaId(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const success = await deleteTemplate(id);
    if (success) {
      toast.success('JSON template deleted successfully!');
      setDeletingTemplateId(null);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    const success = await regenerateApiKey(id);
    if (success) {
      toast.success('API key regenerated successfully!');
    }
  };

  const handleTest = (api: any) => {
    setTestingApi(api);
  };

  const deletingSchema = schemas.find(s => s.id === deletingSchemaId);
  const deletingTemplate = templates.find(t => t.id === deletingTemplateId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors relative">
        {/* Badge */}
        <div className="absolute top-4 right-4 z-10">
          <img 
            src="/white_circle_360x360.png" 
            alt="Powered by Bolt" 
            className="w-16 h-16 opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Projects</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              </div>
              
              <div className="hidden sm:block">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {apis.length} API{apis.length !== 1 ? 's' : ''} • {isSchemaMode() ? `${schemas.length} Schema${schemas.length !== 1 ? 's' : ''} • ` : ''}{templates.length} Template{templates.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Project Description */}
      {project.description && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-blue-800 dark:text-blue-200 text-sm">{project.description}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('apis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'apis'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>APIs ({apis.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>JSON Templates ({templates.length})</span>
              </div>
            </button>
            {/* Only show schemas tab if schema mode is enabled */}
            {isSchemaMode() && (
              <button
                onClick={() => setActiveTab('schemas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'schemas'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                >
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Schemas ({schemas.length})</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'apis' ? (
          <>
            {/* APIs Tab */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Endpoints</h2>
              <button
                onClick={handleCreateNewApi}
                className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New API</span>
              </button>
            </div>

            {apis.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <Globe className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No APIs Yet
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Create your first GET API endpoint for this project. All routes will be automatically 
                    prefixed with your project name: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/{project.name.toLowerCase().replace(/\s+/g, '-')}/your-route</code>
                  </p>
                  
                  <button
                    onClick={handleCreateNewApi}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First API</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {apis.map((api) => (
                  <ApiCard
                    key={api.id}
                    api={api}
                    onEdit={handleEdit}
                    onDelete={handleDeleteApi}
                    onTest={handleTest}
                    onRegenerateKey={handleRegenerateKey}
                  />
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'templates' ? (
          <>
            {/* JSON Templates Tab */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">JSON Templates</h2>
              <button
                onClick={handleCreateNewTemplate}
                className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No JSON Templates Yet
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Create reusable JSON templates that can be used across multiple API endpoints. 
                    Templates help you maintain consistency and save time when creating similar APIs.
                  </p>
                  
                  <button
                    onClick={handleCreateNewTemplate}
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                        </div>
                        
                        {template.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{template.description}</p>
                        )}
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded transition-colors"
                          title="Edit template"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingTemplateId(template.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">JSON Preview:</h4>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto max-h-20">
                        {JSON.stringify(template.json_data, null, 2).length > 100 
                          ? JSON.stringify(template.json_data, null, 2).substring(0, 100) + '...'
                          : JSON.stringify(template.json_data, null, 2)
                        }
                      </pre>
                    </div>

                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="w-full flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Schemas Tab - Only shown if schema mode is enabled */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Schemas</h2>
              <button
                onClick={handleCreateNewSchema}
                className="flex items-center space-x-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Schema</span>
              </button>
            </div>

            {schemas.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <Database className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Schemas Yet
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Create data schemas to structure your API responses. Schemas allow you to manage 
                    data through a user-friendly interface instead of editing JSON manually.
                  </p>
                  
                  <button
                    onClick={handleCreateNewSchema}
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Schema</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemas.map((schema) => (
                  <div key={schema.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{schema.name}</h3>
                        </div>
                        
                        {schema.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{schema.description}</p>
                        )}
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span>{schema.fields.length} field{schema.fields.length !== 1 ? 's' : ''}</span>
                          <span className="mx-2">•</span>
                          <span>Created {new Date(schema.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setDeletingSchemaId(schema.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                        title="Delete schema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Fields:</h4>
                      <div className="space-y-1">
                        {schema.fields.slice(0, 3).map(field => (
                          <div key={field.id} className="flex items-center space-x-2 text-xs">
                            <span className="font-mono text-gray-600 dark:text-gray-400">{field.name}</span>
                            <span className="text-gray-400 dark:text-gray-500">({field.type})</span>
                            {field.required && <span className="text-red-500">*</span>}
                          </div>
                        ))}
                        {schema.fields.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{schema.fields.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setManagingSchema(schema)}
                      className="w-full flex items-center justify-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      <span>Manage Data</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {showApiForm && (
        <ApiForm
          projectId={project.id}
          projectName={project.name}
          api={editingApi || undefined}
          onSave={handleSaveApi}
          onCancel={() => {
            setShowApiForm(false);
            setEditingApi(null);
          }}
        />
      )}

      {showSchemaBuilder && isSchemaMode() && (
        <SchemaBuilder
          projectId={project.id}
          onSave={handleSaveSchema}
          onCancel={() => setShowSchemaBuilder(false)}
        />
      )}

      {showTemplateBuilder && (
        <JsonTemplateBuilder
          projectId={project.id}
          template={editingTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowTemplateBuilder(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {managingSchema && isSchemaMode() && (
        <DataManager
          schema={managingSchema}
          onClose={() => setManagingSchema(null)}
        />
      )}

      {testingApi && (
        <ApiTester
          api={testingApi}
          onClose={() => setTestingApi(null)}
        />
      )}

      {/* Delete Template Confirmation */}
      {deletingTemplateId && deletingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Delete JSON Template</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deletingTemplate.name}"</span>?
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">Template Details:</p>
                  {deletingTemplate.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{deletingTemplate.description}</p>
                  )}
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(deletingTemplate.json_data, null, 2).substring(0, 100)}...
                  </pre>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This template will be permanently removed and can no longer be used in API endpoints.
              </p>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setDeletingTemplateId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTemplate(deletingTemplateId)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Schema Confirmation - Only show if schema mode is enabled */}
      {deletingSchemaId && deletingSchema && isSchemaMode() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-100 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Delete Schema</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deletingSchema.name}"</span>?
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Warning:</p>
                    <p>This will also permanently delete all associated data entries and any API endpoints using this schema.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">Schema Details:</p>
                  <p>{deletingSchema.fields.length} field{deletingSchema.fields.length !== 1 ? 's' : ''} defined</p>
                  {deletingSchema.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{deletingSchema.description}</p>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All schema data and configurations will be permanently removed.
              </p>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex space-x-3">
              <button
                onClick={() => setDeletingSchemaId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSchema(deletingSchemaId)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};