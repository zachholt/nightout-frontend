import axios from 'axios';
import { NearbyLocation } from '../types/location';
import { API_URL } from '../config/api';

interface FavoriteLocation {
  id: number;
  userId: number;
  locationId: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
}

export const favoritesApi = {
  getFavorites: async (userId: number): Promise<FavoriteLocation[]> => {
    const response = await axios.get(`${API_URL}/favorites/${userId}`);
    return response.data;
  },

  addFavorite: async (userId: number, location: NearbyLocation): Promise<FavoriteLocation> => {
    const response = await axios.post(`${API_URL}/favorites?userId=${userId}`, {
      locationId: location.id,
      latitude: location.location.latitude,
      longitude: location.location.longitude,
    });
    return response.data;
  },

  removeFavorite: async (userId: number, locationId: string): Promise<void> => {
    await axios.delete(`${API_URL}/favorites/${userId}/${locationId}`);
  },
}; 