// Error handling utilities for sermon-new components

export const handleError = (error: any, context: string = 'Unknown') => {
  console.error(`[${context}] Error:`, error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`[${context}] Response data:`, error.response.data);
    console.error(`[${context}] Response status:`, error.response.status);
    console.error(`[${context}] Response headers:`, error.response.headers);
    
    return {
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      type: 'server_error'
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error(`[${context}] Request:`, error.request);
    
    return {
      message: 'No response from server. Please check your connection.',
      type: 'network_error'
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(`[${context}] Error message:`, error.message);
    
    return {
      message: error.message || 'An unexpected error occurred',
      type: 'client_error'
    };
  }
};

export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request !== undefined;
};

export const isServerError = (error: any): boolean => {
  return error.response && error.response.status >= 500;
};

export const isClientError = (error: any): boolean => {
  return error.response && error.response.status >= 400 && error.response.status < 500;
};
