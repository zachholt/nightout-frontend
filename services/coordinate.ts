import axios from 'axios';
import { UserResponse } from './user';

const API_URL = 'http://44.203.161.109:8080/api';

export interface CoordinateResponse {
  id: number;
  userId: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  latitude: number | null;
  longitude: number | null;
}

export const coordinateApi = {
  // Check in at a location
  checkIn: async (email: string, latitude: number | null, longitude: number | null): Promise<UserResponse> => {
    try {
      console.log('Sending check-in request:', { email, latitude, longitude });
      
      const response = await axios.post(
        `${API_URL}/users/checkin`, 
        { latitude, longitude },
        { 
          params: { email },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Check-in response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Check-in API error:', error);
      throw error;
    }
  },

  // Check out (remove coordinates)
  checkOut: async (email: string): Promise<UserResponse> => {
    try {
      console.log('Sending check-out request for email:', email);
      
      // Use GET request with null coordinates instead of POST
      const response = await axios.get(
        `${API_URL}/users/me`, 
        { 
          params: { email },
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      // After getting the user, update with null coordinates
      if (response.data) {
        const updateResponse = await axios.post(
          `${API_URL}/users/checkin`,
          { latitude: null, longitude: null },
          {
            params: { email },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        console.log('Check-out response:', updateResponse.data);
        return updateResponse.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('Check-out API error:', error);
      throw error;
    }
  },

  // Get users at specific coordinates
  getNearbyUsers: async (
    latitude: number, 
    longitude: number, 
    radiusInMeters: number = 500
  ): Promise<UserResponse[]> => {
    const response = await axios.get(
      `${API_URL}/coordinates/nearby`, 
      { params: { latitude, longitude, radiusInMeters } }
    );
    return response.data;
  },

  // Get coordinate data for a user by ID
  getUserCoordinates: async (userId: number): Promise<CoordinateResponse> => {
    const response = await axios.get(`${API_URL}/coordinates/user/${userId}`);
    return response.data;
  },

  // Get coordinate data for a user by email
  getUserCoordinatesByEmail: async (email: string): Promise<CoordinateResponse> => {
    const response = await axios.get(
      `${API_URL}/coordinates/user`, 
      { params: { email } }
    );
    return response.data;
  }
}; 