// Define your Google Maps API key directly here
const GOOGLE_MAPS_API_KEY = 'AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs';

import { NearbyLocation } from '../types/location';

// Function to fetch nearby places from Google Places API
export const fetchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  setIsLoading: (value: boolean) => void,
  setError: (value: string | null) => void
): Promise<NearbyLocation[]> => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Fetch all bars in a single request
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=11500&type=bar|restaurant&keyword=bar&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch nearby places');
    }
    
    const data = await response.json();

    console.log('featch bar response', data )
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status}`);
    }
    
    // Process and return the results
    return data.results.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      address: place.vicinity,
      type: 'bar',
      isOpenNow: place.opening_hours?.open_now,
      rating: place.rating,
      details: null,
    }));
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    setError('Failed to fetch nearby places. Please try again.');
    return [];
  } finally {
    setIsLoading(false);
  }
};

// Function to fetch place details from Google Places API
export const fetchPlaceDetails = async (
  placeId: string,
  setError: (value: string | null) => void
) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,price_level,website,photos&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch place details');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status}`);
    }
    
    return {
      name: data.result.name,
      address: data.result.formatted_address,
      phoneNumber: data.result.formatted_phone_number,
      openingHours: data.result.opening_hours?.weekday_text,
      rating: data.result.rating,
      priceLevel: data.result.price_level,
      website: data.result.website,
      photos: data.result.photos?.map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    setError('Failed to fetch place details. Please try again.');
    return null;
  }
}; 