import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

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