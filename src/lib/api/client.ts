import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('d2win_token') || sessionStorage.getItem('d2win_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('d2win_token');
      sessionStorage.removeItem('d2win_token');
      localStorage.removeItem('d2win_user');
      sessionStorage.removeItem('d2win_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
