import axios from 'axios';
import { API_URL } from '../config/api';

interface Coordinate {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export const coordinatesApi = {
  getCurrentLocation: async (userId: number): Promise<Coordinate | null> => {
    const response = await axios.get(`${API_URL}/coordinates/${userId}`);
    return response.data;
  },

  updateLocation: async (userId: number, latitude: number, longitude: number): Promise<Coordinate> => {
    const response = await axios.post(`${API_URL}/coordinates?userId=${userId}`, {
      latitude,
      longitude,
    });
    return response.data;
  },

  clearLocation: async (userId: number): Promise<void> => {
    await axios.delete(`${API_URL}/coordinates/${userId}`);
  },
}; 