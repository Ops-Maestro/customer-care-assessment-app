import axios from 'axios';

// ✅ UPDATE: Point this to your ACTUAL Render Backend URL
const baseUrl = 'https://customer-care-assessment-app.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: baseUrl,
});

/**
 * REQUEST INTERCEPTOR
 * Automatically attaches the JWT token to every outgoing request.
 */
api.interceptors.request.use(
  (config) => {
    // ✅ UPDATE: Changed to 'token' to match your login logic
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 * Handles global error states, specifically 401 (Unauthorized) 
 * and 403 (Forbidden) for session management.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;

    // ✅ FULL CHANGE: Added a check to ensure we don't redirect if we are already attempting to login
    // This prevents the "Initializing assessment" loop.
    if ((status === 401 || status === 403) && !currentPath.includes('/login') && !currentPath.includes('/admin')) {
      console.warn('Session expired or unauthorized. Purging local security credentials...');
      
      // ✅ Completely clear all stored admin and user details
      localStorage.clear(); 
      
      // If the user was on the dashboard or test page, send them back to login
      window.location.href = currentPath.includes('admin') ? '/admin' : '/login';
    }
    return Promise.reject(error);
  }
);

export default api;