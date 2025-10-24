import axios from 'axios';

const baseUrl = process.env.REACT_APP_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: baseUrl,
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid - clear everything
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('adminEmail');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;