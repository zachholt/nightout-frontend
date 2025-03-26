import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '@/services/user';
import * as Location from 'expo-location';
import { saveUserToStorage, getUserFromStorage, clearAuthStorage } from '../utils/storageUtils';
import * as FileSystem from 'expo-file-system';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profileImage: string;
  latitude: number | null;
  longitude: number | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isCheckingIn: boolean;
  error: string | null;
  checkIn: (latitude: number, longitude: number) => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedInAt: (locationCoords: { latitude: number; longitude: number }) => boolean;
  getUsersByLocation: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
  getUsersAtLocation: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
  logout: () => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>; // New function for updating profile picture
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to check if coordinates are within a small radius
const areCoordinatesClose = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusInMeters: number = 50
): boolean => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusInMeters;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from storage on initial mount
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await getUserFromStorage();
        if (!storedUser) {
          setIsLoading(false);
          return;
        }

        // Verify the user still exists in the backend
        try {
          const currentUser = await userApi.getCurrentUser(storedUser.email);
          setUser(currentUser);
        } catch (error) {
          // If user doesn't exist in backend (403 or other error), clear storage and return
          console.error('Error verifying user in backend:', error);
          await clearAuthStorage();
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        await clearAuthStorage();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Save user to storage whenever it changes
  useEffect(() => {
    const saveUser = async () => {
      if (user) {
        await saveUserToStorage(user);
      }
    };

    saveUser();
  }, [user]);

  const checkIn = async (latitude: number, longitude: number) => {
    if (!user) {
      setError('You must be logged in to check in');
      return;
    }

    try {
      setIsCheckingIn(true);
      setError(null);

      const updatedUser = await userApi.checkIn(user.email, latitude, longitude);
      setUser(updatedUser);
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Failed to check in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const checkOut = async () => {
    if (!user) {
      setError('You must be logged in to check out');
      return;
    }

    try {
      setIsCheckingIn(true);
      setError(null);

      const updatedUser = await userApi.checkOut(user.email);
      setUser(updatedUser);
    } catch (error) {
      console.error('Check-out error:', error);
      setError('Failed to check out');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const isCheckedInAt = (locationCoords: { latitude: number; longitude: number }): boolean => {
    if (!user || user.latitude === null || user.longitude === null) return false;
    
    // Use Haversine formula for more accurate distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (user.latitude * Math.PI) / 180;
    const φ2 = (locationCoords.latitude * Math.PI) / 180;
    const Δφ = ((locationCoords.latitude - user.latitude) * Math.PI) / 180;
    const Δλ = ((locationCoords.longitude - user.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Increase the check-in radius to 100 meters (from 50) to match the server
    return distance <= 100;
  };

  const getUsersByLocation = async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number = 500
  ): Promise<User[]> => {
    try {
      setError(null);
      const users = await userApi.getUsersByCoordinates(latitude, longitude, radiusInMeters);
      return users;
    } catch (err) {
      console.error('Get users error:', err);
      return [];
    }
  };

  const getUsersAtLocation = async (
    latitude: number,
    longitude: number,
    radiusInMeters: number = 100
  ): Promise<User[]> => {
    try {
      setError(null);
      const users = await userApi.getUsersAtLocation(latitude, longitude, radiusInMeters);
      return users;
    } catch (err) {
      console.error('Get users at location error:', err);
      return [];
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (user) {
        await userApi.checkOut(user.email);
      }
      setUser(null);
      await clearAuthStorage();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile picture
  const updateProfilePicture = async (base64Image: string) => {
    if (!user) {
      setError('You must be logged in to update your profile picture.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Log the base64 image to confirm it's captured correctly
      console.log('Base64 Image:', base64Image);
      // Send the base64 image to the backend
      // const updatedUser = await userApi.updateProfilePicture(user.email, base64Image);

      // For testing purposes, simulate an updated user object
      const updatedUser = {
        ...user,
        profileImage: `data:image/jpg;base64,${base64Image}`, // Update the profile image locally
      };

      // Update the user state with the new profile picture
      setUser(updatedUser);
    } catch (err) {
      setError('Failed to update profile picture. Please try again.');
      console.error('Update profile picture error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isCheckingIn,
        error,
        checkIn,
        checkOut,
        isCheckedInAt,
        getUsersByLocation,
        getUsersAtLocation,
        logout,
        updateProfilePicture
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};