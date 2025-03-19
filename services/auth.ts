import axios from 'axios';
import { getAuthToken } from '@/app/utils/storageUtils';

const API_URL = 'http://44.203.161.109:8080/api';

// Configure axios to use the stored token for all requests
axios.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  id: number;
  name: string;
  email: string;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await axios.post(`${API_URL}/auth/register`, credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axios.post(`${API_URL}/auth/logout`);
  },
}; 