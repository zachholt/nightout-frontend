import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi } from '@/services/user';
import { coordinateApi } from '@/services/coordinate';
import * as Location from 'expo-location';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  profileImage: string;
  // Coordinates from the CoordinateData model
  latitude: number | null;
  longitude: number | null;
  // New property to indicate if user is checked in
  isCheckedIn: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  error: string | null;
  checkIn: (location: { latitude: number; longitude: number }) => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedInAt: (location: { latitude: number; longitude: number }) => boolean;
  getUsersByLocation: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
}

// Distance threshold in meters to consider a user checked in at a location
const CHECK_IN_THRESHOLD = 50;

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is checked in at a specific location
  const isCheckedInAt = (location: { latitude: number; longitude: number }): boolean => {
    if (!user || user.latitude === null || user.longitude === null) {
      return false;
    }

    // Calculate distance between user's check-in location and the given location
    const distance = calculateDistance(
      user.latitude,
      user.longitude,
      location.latitude,
      location.longitude
    );

    // Consider checked in if within threshold distance
    return distance <= CHECK_IN_THRESHOLD;
  };

  // Calculate distance between two points in meters using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  // Check-in function
  const checkIn = async (location: { latitude: number; longitude: number }) => {
    if (!user) {
      setError('You must be logged in to check in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use the coordinate API
      const updatedUser = await coordinateApi.checkIn(user.email, location.latitude, location.longitude);
      
      // Update the user state with the new coordinates and set isCheckedIn to true
      setUser({
        ...updatedUser,
        isCheckedIn: true
      });
    } catch (err) {
      setError('Failed to check in. Please try again.');
      console.error('Check-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check-out function (sets coordinates to null)
  const checkOut = async () => {
    if (!user) {
      setError('You must be logged in to check out');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Use the coordinate API
      const updatedUser = await coordinateApi.checkOut(user.email);
      
      // Update the user state with null coordinates and set isCheckedIn to false
      setUser({
        ...updatedUser,
        isCheckedIn: false
      });
    } catch (err) {
      setError('Failed to check out. Please try again.');
      console.error('Check-out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get users by location
  const getUsersByLocation = async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number = 500
  ): Promise<User[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the new coordinate API
      const users = await coordinateApi.getNearbyUsers(latitude, longitude, radiusInMeters);
      return users;
    } catch (err) {
      setError('Failed to get users at this location.');
      console.error('Get users error:', err);
      return [];
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
        error,
        checkIn,
        checkOut,
        isCheckedInAt,
        getUsersByLocation,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};