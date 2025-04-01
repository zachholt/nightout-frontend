import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { userApi } from '@/services/user';
import * as Location from 'expo-location';
import { saveUserToStorage, getUserFromStorage, clearAuthStorage } from '../utils/storageUtils';
import * as FileSystem from 'expo-file-system';
import { authApi } from '@/services/auth';

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
  nearbyUsers: User[];
  getUsersNearby: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
  getUsersAtLocation: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
  logout: () => Promise<void>;
  updateProfilePicture: (imageUri: string) => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const areCoordinatesClose = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusInMeters: number = 10
): boolean => {
  const R = 6371e3;
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
  const [nearbyUsers, setNearbyUsers] = useState<User[]>([]);
  const [lastCheckedInLocation, setLastCheckedInLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await getUserFromStorage();
        if (!storedUser) {
          setIsLoading(false);
          return;
        }

        try {
          const currentUser = await userApi.getCurrentUser(storedUser.email);
          setUser(currentUser);
        } catch (error) {
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

  useEffect(() => {
    const saveUser = async () => {
      if (user) {
        await saveUserToStorage(user);
      }
    };

    saveUser();
  }, [user]);

  const checkIn = useCallback(async (latitude: number, longitude: number) => {
    if (!user) {
      setError('You must be logged in to check in');
      return;
    }
    console.log('[UserContext] Attempting checkIn...');
    try {
      setIsCheckingIn(true);
      setError(null);
      
      // Store exact coordinates for precise check-in
      setLastCheckedInLocation({ 
        latitude: Number(latitude.toFixed(7)), 
        longitude: Number(longitude.toFixed(7)) 
      });
      
      const updatedUser = await userApi.checkIn(user.email, latitude, longitude);
      console.log('[UserContext] CheckIn API success. Updated user:', updatedUser);
      console.log('[UserContext] Setting user state...');
      setUser(updatedUser);
      console.log('[UserContext] User state set.');
      try {
        // Use smaller radius for nearby users
        const users = await userApi.getUsersNearby(latitude, longitude, 10);
        console.log('[UserContext] Fetched nearby users after checkIn:', users);
        setNearbyUsers(users);
      } catch (nearbyError) {
        console.error('Error fetching nearby users after check-in:', nearbyError);
        setNearbyUsers([]);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Failed to check in');
      setNearbyUsers([]);
      setLastCheckedInLocation(null);
    } finally {
      console.log('[UserContext] Setting isCheckingIn to false.');
      setIsCheckingIn(false);
    }
  }, [user, setUser, setNearbyUsers, setIsCheckingIn, setError]);

  const checkOut = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to check out');
      return;
    }
    console.log('[UserContext] Attempting checkOut...');
    try {
      setIsCheckingIn(true);
      setError(null);
      const updatedUser = await userApi.checkOut(user.email);
      console.log('[UserContext] CheckOut API success. Updated user:', updatedUser);
      console.log('[UserContext] Setting user state...');
      setUser(updatedUser);
      console.log('[UserContext] User state set.');
      setNearbyUsers([]);
      setLastCheckedInLocation(null);
    } catch (error) {
      console.error('Check-out error:', error);
      setError('Failed to check out');
    } finally {
      console.log('[UserContext] Setting isCheckingIn to false.');
      setIsCheckingIn(false);
    }
  }, [user, setUser, setNearbyUsers, setIsCheckingIn, setError]);

  const isCheckedInAt = useCallback((locationCoords: { latitude: number; longitude: number }): boolean => {
    if (!user) return false;
    
    // First, check if the user has coordinates
    if (user.latitude !== null && user.longitude !== null) {
      // Calculate if within distance - using very small radius for exact check-ins
      const isWithinRadius = areCoordinatesClose(
        user.latitude, 
        user.longitude, 
        locationCoords.latitude, 
        locationCoords.longitude,
        10 // Explicitly set to 10m for precision
      );
      
      console.log(`[UserContext] isCheckedInAt standard check:`, {
        userCoords: { lat: user.latitude, lng: user.longitude },
        locationCoords,
        isWithinRadius
      });
      
      if (isWithinRadius) return true;
    }
    
    // Special case: If this is the location we just checked into
    if (lastCheckedInLocation !== null) {
      // Use exact coordinates with very small radius 
      const isLastCheckedInLocation = areCoordinatesClose(
        lastCheckedInLocation.latitude,
        lastCheckedInLocation.longitude,
        locationCoords.latitude,
        locationCoords.longitude,
        10 // Explicitly use a very small radius
      );
      
      console.log(`[UserContext] isCheckedInAt lastCheckedInLocation check:`, {
        lastCheckedInLocation,
        locationCoords,
        isLastCheckedInLocation
      });
      
      if (isLastCheckedInLocation) return true;
    }
    
    // Special case: We're in the middle of checking in/out status
    // If isCheckingIn is true, we've initiated but not completed a state change 
    if (isCheckingIn) {
      console.log('[UserContext] isCheckedInAt - Still processing check-in/out');
      return false; // Return previous state since we're in transition
    }
    
    // Return final determination
    return false;
  }, [user, isCheckingIn, lastCheckedInLocation]);

  const getUsersNearby = useCallback(async (
    latitude: number, 
    longitude: number, 
    radiusInMeters?: number
  ): Promise<User[]> => {
    try {
      setError(null);
      const users = await userApi.getUsersNearby(latitude, longitude, radiusInMeters);
      setNearbyUsers(users);
      return users;
    } catch (err) {
      console.error('Get nearby users error:', err);
      setNearbyUsers([]);
      return [];
    }
  }, [setError, setNearbyUsers]);

  const getUsersAtLocation = useCallback(async (
    latitude: number,
    longitude: number,
    radiusInMeters?: number
  ): Promise<User[]> => {
    try {
      setError(null);
      const users = await userApi.getUsersAtLocation(latitude, longitude, radiusInMeters);
      return users;
    } catch (err) {
      console.error('Get users at location error:', err);
      return [];
    }
  }, [setError]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      if (user) {
        try {
          await userApi.checkOut(user.email);
        } catch (checkoutError) {
          console.warn('Error during checkout on logout:', checkoutError);
        }
      }
      setUser(null);
      setNearbyUsers([]);
      await clearAuthStorage();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser, setNearbyUsers, setIsLoading]);

  const updateProfilePicture = useCallback(async (base64Image: string) => {
    if (!user) {
      setError('You must be logged in to update your profile picture.');
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      console.log('Base64 Image:', base64Image);
      const updatedUser = { ...user, profileImage: `data:image/jpg;base64,${base64Image}` };
      setUser(updatedUser);
    } catch (err) {
      setError('Failed to update profile picture. Please try again.');
      console.error('Update profile picture error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser, setError, setIsLoading]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to delete your account.');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete the user account
      await authApi.deleteAccount(user.email);
      
      // Clear user data from context and storage
      setUser(null);
      setNearbyUsers([]);
      await clearAuthStorage();
      
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      setError('Failed to delete account. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, setUser, setNearbyUsers, setError, setIsLoading]);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    isLoading,
    isCheckingIn,
    error,
    checkIn,
    checkOut,
    isCheckedInAt,
    nearbyUsers,
    getUsersNearby,
    getUsersAtLocation,
    logout,
    updateProfilePicture,
    deleteAccount
  }), [
    user, 
    isLoading, 
    isCheckingIn, 
    error, 
    checkIn, 
    checkOut, 
    isCheckedInAt,
    nearbyUsers, 
    getUsersNearby, 
    getUsersAtLocation, 
    logout, 
    updateProfilePicture,
    deleteAccount
  ]);

  return (
    <UserContext.Provider value={contextValue}>
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