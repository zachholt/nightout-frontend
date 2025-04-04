import axios from 'axios';
import { API_URL } from '../config/api';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profileImage: string;
  latitude: number | null;
  longitude: number | null;
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
  checkIn: async (email: string, latitude: number, longitude: number): Promise<UserResponse> => {
    const response = await axios.post(
      `${API_URL}/users/checkin`, 
      { latitude, longitude },
      { params: { email } }
    );
    return response.data;
  },

  // Check out from current location
  checkOut: async (email: string): Promise<UserResponse> => {
    const response = await axios.post(
      `${API_URL}/users/checkout`,
      {},
      { params: { email } }
    );
    return response.data;
  },

  // Get users at specific coordinates
  getUsersByCoordinates: async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number = 20
  ): Promise<UserResponse[]> => {
    const response = await axios.get(
      `${API_URL}/users/by-coordinates`, 
      { params: { latitude, longitude, radiusInMeters } }
    );
    return response.data;
  },
  
  // Get users at a specific location (venue)
  getUsersAtLocation: async (
    latitude: number,
    longitude: number,
    radiusInMeters: number = 10
  ): Promise<UserResponse[]> => {
    const response = await axios.get(
      `${API_URL}/users/at-location`,
      { params: { latitude, longitude, radiusInMeters } }
    );
    return response.data;
  }
}; 