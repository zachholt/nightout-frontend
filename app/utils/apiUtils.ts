// Define your Google Maps API key directly here
const GOOGLE_MAPS_API_KEY = 'AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs';

import { NearbyLocation } from '../types/location';

// Function to fetch nearby places from Google Places API
export const fetchNearbyPlaces = async (
  selectedTypes: string[],
  radius: number,
  latitude: number,
  longitude: number,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string | null) => void
): Promise<NearbyLocation[]> => {
  setLoading?.(true);
  setError?.(null);
  
  try {
    // If no types selected, default to showing all types
    const typesToUse = selectedTypes.length === 0 
      ? ['bar', 'restaurant', 'night_club', 'hotel'] 
      : selectedTypes;
    
    // Store all results across all API calls
    let allResults: any[] = [];
    const processedPlaceIds = new Set<string>(); // Track IDs to avoid duplicates
    
    // Make separate API calls for each type (Google Places API limitation)
    for (const type of typesToUse) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Fetch places for this type
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Failed to fetch nearby places for type: ${type}`);
        continue; // Skip this type but continue with others
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.warn(`Google Places API error for type ${type}:`, data.status, data.error_message);
        continue; // Skip this type but continue with others
      }
      
      // Add results, checking for duplicates
      if (data.results && data.results.length > 0) {
        for (const place of data.results) {
          if (!processedPlaceIds.has(place.place_id)) {
            allResults.push(place);
            processedPlaceIds.add(place.place_id);
          }
        }
      }
    }
    
    // Process and return the combined results
    return allResults.map((place: any) => {
      // Determine the primary type from the types array
      let primaryType = 'bar'; // Default type
      
      if (place.types && place.types.length > 0) {
        // Check for specific venue types in order of priority
        if (place.types.includes('night_club')) {
          primaryType = 'night_club';
        } else if (place.types.includes('bar')) {
          primaryType = 'bar';
        } else if (place.types.includes('restaurant')) {
          primaryType = 'restaurant';
        } else if (place.types.includes('cafe')) {
          primaryType = 'cafe';
        } else if (place.types.includes('movie_theater')) {
          primaryType = 'movie_theater';
        } else if (place.types.includes('bowling_alley')) {
          primaryType = 'bowling_alley';
        } else {
          // Use the first type if none of the specific types match
          primaryType = place.types[0];
        }
      }
      
      return {
        id: place.place_id,
        name: place.name,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        address: place.vicinity,
        type: primaryType,
        isOpenNow: place.opening_hours?.open_now,
        rating: place.rating,
        details: null,
      };
    });
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    setError?.('Failed to fetch nearby places. Please try again.');
    return [];
  } finally {
    setLoading?.(false);
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