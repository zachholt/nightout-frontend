import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NearbyLocation } from '../types/location';
import { useUser } from './UserContext';
import { favoritesApi } from '../services/favorites';

interface FavoriteContextType {
  favorites: NearbyLocation[];
  addFavorite: (location: NearbyLocation) => Promise<void>;
  removeFavorite: (locationId: string) => Promise<void>;
  isFavorite: (locationId: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

const STORAGE_KEY = 'nightout_favorites';

export const FavoriteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<NearbyLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  // Load favorites from storage and sync with backend when user changes
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Load from local storage first for immediate display
        const storedFavorites = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }

        // Then fetch from backend and update
        const backendFavorites = await favoritesApi.getFavorites(user.id);
        
        // Convert backend format to NearbyLocation format
        const convertedFavorites: NearbyLocation[] = backendFavorites.map(fav => ({
          id: fav.locationId,
          name: '',
          location: {
            latitude: fav.latitude,
            longitude: fav.longitude,
          },
          address: '',
          type: 'unknown',
          details: null,
        }));

        setFavorites(convertedFavorites);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convertedFavorites));
      } catch (error) {
        console.error('Error loading favorites:', error);
        setError('Failed to load favorites');
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  const addFavorite = async (location: NearbyLocation) => {
    if (!user) {
      setError('You must be logged in to add favorites');
      return;
    }

    try {
      setError(null);
      // Add to backend first
      await favoritesApi.addFavorite(user.id, location);
      
      // If successful, update local state and storage
      const newFavorites = [...favorites, location];
      setFavorites(newFavorites);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error adding favorite:', error);
      setError('Failed to add favorite');
      throw error;
    }
  };

  const removeFavorite = async (locationId: string) => {
    if (!user) {
      setError('You must be logged in to remove favorites');
      return;
    }

    try {
      setError(null);
      // Remove from backend first
      await favoritesApi.removeFavorite(user.id, locationId);
      
      // If successful, update local state and storage
      const newFavorites = favorites.filter(location => location.id !== locationId);
      setFavorites(newFavorites);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('Failed to remove favorite');
      throw error;
    }
  };

  const isFavorite = (locationId: string) => {
    return favorites.some(location => location.id === locationId);
  };

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        isLoading,
        error,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
}; 