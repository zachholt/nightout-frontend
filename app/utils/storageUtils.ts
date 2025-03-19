import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../context/UserContext';

// Storage keys
const STORAGE_KEYS = {
  USER: 'nightout_user',
  AUTH_TOKEN: 'nightout_auth_token',
};

/**
 * Save user data to AsyncStorage
 * @param user User data to save
 */
export const saveUserToStorage = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

/**
 * Get user data from AsyncStorage
 * @returns User data or null if not found
 */
export const getUserFromStorage = async (): Promise<User | null> => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

/**
 * Save authentication token to AsyncStorage
 * @param token Authentication token
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token to storage:', error);
  }
};

/**
 * Get authentication token from AsyncStorage
 * @returns Authentication token or null if not found
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token from storage:', error);
    return null;
  }
};

/**
 * Clear all authentication data from AsyncStorage
 */
export const clearAuthStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.AUTH_TOKEN]);
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
}; 