import axios from 'axios';

// Instantiate localized axios instance matching deployment configurations
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Outbound request interceptor to automatically attach authorization tokens
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Inbound response interceptor to handle standard security or session failures
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expires or becomes invalid, wipe the session state immediately
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only trigger reload if the user isn't already on a public authentication page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?message=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

// Unified API Service Catalog Matrix
const apiService = {
  auth: {
    register: (payload) => API.post('/api/auth/register', payload),
    login: (payload) => API.post('/api/auth/login', payload),
    getMe: () => API.get('/api/auth/me')
  },
  urls: {
    create: (payload) => API.post('/api/urls', payload),
    getAll: (params) => API.get('/api/urls', { params }),
    update: (id, payload) => API.patch(`/api/urls/${id}`, payload),
    delete: (id) => API.delete(`/api/urls/${id}`)
  },
  analytics: {
    get: (urlId) => API.get(`/api/analytics/${urlId}`),
    getAdminStats: () => API.get('/api/analytics/admin/stats')
  }
};

export default apiService;