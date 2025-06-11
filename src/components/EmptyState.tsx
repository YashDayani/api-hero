import React from 'react';
import { Plus, Zap } from 'lucide-react';

interface EmptyStateProps {
  onCreateNew: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNew }) => {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No API Endpoints Yet
        </h3>
        
        <p className="text-gray-600 mb-8">
          Create your first custom API endpoint to get started. You can define routes, 
          set JSON responses, and test them instantly.
        </p>
        
        <button
          onClick={onCreateNew}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Your First Endpoint</span>
        </button>
      </div>
    </div>
  );
};