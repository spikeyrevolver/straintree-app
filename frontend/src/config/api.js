// API Configuration for StrainTree
// This ensures all API calls use HTTPS and the correct domain

// Get the current domain and protocol
const getApiBaseUrl = () => {
  // Always use HTTPS for production
  return 'https://straintree-app.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to make API calls with correct base URL
export const apiCall = async (endpoint, options = {}) => {
  // Ensure we always use the correct HTTPS URL
  const baseUrl = API_BASE_URL;
  let url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : endpoint;
  
  // CRITICAL: Force HTTPS to prevent Mixed Content errors
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  // Additional safety check - ensure HTTPS
  if (!url.startsWith('https://')) {
    url = `https://${url.replace(/^https?:\/\//, '')}`;
  }
  
  console.log(`API Base URL: ${baseUrl}`);
  console.log(`Making API call to: ${url}`); // Debug log
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    return response;
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    console.error('Error details:', error);
    throw error;
  }
};

// Specific API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    CHECK: '/api/auth/check',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
  },
  STRAINS: '/api/strains',
  FAMILY_TREES: '/api/family-trees',
  USERS: '/api/users',
};

export default {
  API_BASE_URL,
  apiCall,
  API_ENDPOINTS,
};

