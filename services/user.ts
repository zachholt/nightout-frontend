import axios from 'axios';
import { API_URL } from '../app/config/api';

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
    const response = await axios.get(`${API_URL}/users/me`, { params: { email } });
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
      null,
      { 
        params: { 
          email, 
          latitude, 
          longitude 
        } 
      }
    );
    return response.data;
  },

  // Check out from current location
  checkOut: async (email: string): Promise<UserResponse> => {
    const response = await axios.post(
      `${API_URL}/users/checkout`,
      null,
      { params: { email } }
    );
    return response.data;
  },

  // Get users at specific coordinates
  getUsersNearby: async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number = 20
  ): Promise<UserResponse[]> => {
    const response = await axios.get(
      `${API_URL}/users/nearby`,
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