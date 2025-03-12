import axios from 'axios';

const API_URL = 'http://98.82.6.247:8080/api';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profileImage: string;
  coordinates: string;
}

export interface CheckInRequest {
  coordinates: string;
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
  },

  // Check in at a location
  checkIn: async (email: string, coordinates: string): Promise<UserResponse> => {
    const response = await axios.post(
      `${API_URL}/users/checkin?email=${email}&coordinates=${coordinates}`
    );
    return response.data;
  },

  // Get users at specific coordinates
  getUsersByCoordinates: async (coordinates: string): Promise<UserResponse[]> => {
    const response = await axios.get(
      `${API_URL}/users/by-coordinates?coordinates=${coordinates}`
    );
    return response.data;
  }
}; 