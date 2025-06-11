import { useState, useEffect } from 'react';
import { Endpoint } from '../types/endpoint';

const STORAGE_KEY = 'api-endpoints';

export const useEndpoints = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEndpoints(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored endpoints:', error);
      }
    }
  }, []);

  const saveEndpoints = (newEndpoints: Endpoint[]) => {
    setEndpoints(newEndpoints);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEndpoints));
  };

  const addEndpoint = (endpoint: Omit<Endpoint, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEndpoint: Endpoint = {
      ...endpoint,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveEndpoints([...endpoints, newEndpoint]);
    return newEndpoint;
  };

  const updateEndpoint = (id: string, updates: Partial<Endpoint>) => {
    const newEndpoints = endpoints.map(endpoint =>
      endpoint.id === id
        ? { ...endpoint, ...updates, updatedAt: new Date().toISOString() }
        : endpoint
    );
    saveEndpoints(newEndpoints);
  };

  const deleteEndpoint = (id: string) => {
    saveEndpoints(endpoints.filter(endpoint => endpoint.id !== id));
  };

  const getEndpointByRoute = (route: string, method: string) => {
    return endpoints.find(endpoint => 
      endpoint.route === route && endpoint.method === method
    );
  };

  const exportEndpoints = () => {
    const dataStr = JSON.stringify(endpoints, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'api-endpoints.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importEndpoints = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            const validEndpoints = imported.filter(item => 
              item.id && item.name && item.route && item.method && item.jsonData
            );
            saveEndpoints([...endpoints, ...validEndpoints]);
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  return {
    endpoints,
    addEndpoint,
    updateEndpoint,
    deleteEndpoint,
    getEndpointByRoute,
    exportEndpoints,
    importEndpoints,
  };
};