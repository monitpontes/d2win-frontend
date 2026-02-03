import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 segundos para cold start do Render
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('d2win_token') || sessionStorage.getItem('d2win_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Interceptor para log de resposta e tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
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
