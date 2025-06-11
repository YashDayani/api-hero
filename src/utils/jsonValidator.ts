export const validateJson = (jsonString: string | any): { isValid: boolean; error?: string } => {
  // Handle non-string inputs
  if (typeof jsonString !== 'string') {
    if (jsonString === null || jsonString === undefined) {
      return { isValid: false, error: 'JSON cannot be empty' };
    }
    // If it's already an object, try to stringify it first
    try {
      jsonString = JSON.stringify(jsonString);
    } catch (error) {
      return { isValid: false, error: 'Invalid input type for JSON validation' };
    }
  }

  if (!jsonString.trim()) {
    return { isValid: false, error: 'JSON cannot be empty' };
  }

  try {
    JSON.parse(jsonString);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
};

export const formatJson = (jsonString: string | any): string => {
  try {
    // Handle non-string inputs
    if (typeof jsonString !== 'string') {
      jsonString = JSON.stringify(jsonString);
    }
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return typeof jsonString === 'string' ? jsonString : '{}';
  }
};

export const minifyJson = (jsonString: string | any): string => {
  try {
    // Handle non-string inputs
    if (typeof jsonString !== 'string') {
      jsonString = JSON.stringify(jsonString);
    }
    return JSON.stringify(JSON.parse(jsonString));
  } catch {
    return typeof jsonString === 'string' ? jsonString : '{}';
  }
};