import React, { createContext, useContext, useState } from 'react';
import { userApi } from '@/services/user';
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
  error: string | null;
  checkIn: (location: { latitude: number; longitude: number }) => Promise<void>;
  getUsersByLocation: (latitude: number, longitude: number, radiusInMeters?: number) => Promise<User[]>;
  updateProfilePicture: (imageUri: string) => Promise<void>; // New function for updating profile picture
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check-in function
  const checkIn = async (location: { latitude: number; longitude: number }) => {
    if (!user) {
      setError('You must be logged in to check in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Pass latitude and longitude directly instead of as a string
      const updatedUser = await userApi.checkIn(user.email, location.latitude, location.longitude);
      
      // Update the user state with the new coordinates
      setUser(updatedUser);
    } catch (err) {
      setError('Failed to check in. Please try again.');
      console.error('Check-in error:', err);
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
      
      // Call the API to get users at the specified coordinates with radius
      const users = await userApi.getUsersByCoordinates(latitude, longitude, radiusInMeters);
      return users;
    } catch (err) {
      setError('Failed to get users at this location.');
      console.error('Get users error:', err);
      return [];
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
        error,
        checkIn,
        getUsersByLocation,
        updateProfilePicture, // Add the new function to the context
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