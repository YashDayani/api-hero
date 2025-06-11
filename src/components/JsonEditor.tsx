import React, { useState, useEffect } from 'react';
import { validateJson, formatJson } from '../utils/jsonValidator';
import { Check, X, Code2, Minimize2 } from 'lucide-react';

interface JsonEditorProps {
  value: string | any;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  placeholder = '{\n  "message": "Hello, World!"\n}',
  className = '',
}) => {
  // Safely convert value to string
  const getStringValue = (val: any): string => {
    if (typeof val === 'string') {
      return val;
    }
    if (val === null || val === undefined) {
      return '';
    }
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return '';
    }
  };

  const [localValue, setLocalValue] = useState(getStringValue(value));
  const [validation, setValidation] = useState(validateJson(localValue));

  useEffect(() => {
    const stringValue = getStringValue(value);
    setLocalValue(stringValue);
    setValidation(validateJson(stringValue));
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    const newValidation = validateJson(newValue);
    setValidation(newValidation);
    onChange(newValue);
  };

  const handleFormat = () => {
    if (validation.isValid) {
      const formatted = formatJson(localValue);
      setLocalValue(formatted);
      onChange(formatted);
    }
  };

  const handleMinify = () => {
    if (validation.isValid) {
      try {
        const minified = JSON.stringify(JSON.parse(localValue));
        setLocalValue(minified);
        onChange(minified);
      } catch {
        // Handle error silently
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">JSON Response</span>
          {validation.isValid ? (
            <div className="flex items-center text-green-600 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Valid JSON
            </div>
          ) : (
            <div className="flex items-center text-red-600 text-xs">
              <X className="w-3 h-3 mr-1" />
              Invalid JSON
            </div>
          )}
        </div>
        
        {validation.isValid && (
          <div className="flex space-x-1">
            <button
              onClick={handleFormat}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Format JSON"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleMinify}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Minify JSON"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-64 p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          validation.isValid 
            ? 'border-gray-300 bg-white' 
            : 'border-red-300 bg-red-50'
        }`}
        spellCheck={false}
      />
      
      {!validation.isValid && validation.error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
          <strong>JSON Error:</strong> {validation.error}
        </div>
      )}
    </div>
  );
};