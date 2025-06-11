import React from 'react';
import { Plus, Download, Upload, Zap } from 'lucide-react';

interface HeaderProps {
  onCreateNew: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  endpointCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onCreateNew,
  onExport,
  onImport,
  endpointCount,
}) => {
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImport(file);
      }
    };
    input.click();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">API Hero</h1>
            </div>
            <div className="hidden sm:block">
              <span className="text-sm text-gray-500">
                {endpointCount} endpoint{endpointCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleImportClick}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Import endpoints"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              onClick={onExport}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Export endpoints"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={onCreateNew}
              className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Endpoint</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};