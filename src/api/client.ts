import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://plantin-api.up.railway.app';



export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return; // Skip undefined/null values
        }
        
        if (Array.isArray(value)) {
          // Para arrays, enviar múltiples parámetros con el mismo nombre
          value.forEach(item => {
            if (item !== undefined && item !== null) {
              searchParams.append(key, String(item));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      });
      
      return searchParams.toString();
    }
  }
});

// Request interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response?.status === 401) {
      if (!isLoginRequest && useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout();
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    } else if (error.response?.status >= 500 && !isLoginRequest) {
      toast.error('Error del servidor. Intenta nuevamente más tarde.');
    } else if (error.response?.data?.message && !isLoginRequest) {
      toast.error(error.response.data.message);
    }
    return Promise.reject(error);
  }
); 