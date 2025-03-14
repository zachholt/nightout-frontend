import axios from 'axios';

const API_URL = 'http://44.203.161.109:8080/api';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profileImage: string;
  latitude: number | null;
  longitude: number | null;
  isCheckedIn: boolean;
}

export const userApi = {
  // Get current user
  getCurrentUser: async (email: string): Promise<UserResponse> => {
    const response = await axios.get(`${API_URL}/users/me?email=${email}`);
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: number): Promise<UserResponse> => {
    const response = await axios.get(`${API_URL}/users/${id}`);
    return response.data;
  }
};