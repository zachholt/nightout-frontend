import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MapView, { Region, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { NearbyLocation } from '../../types/location';
import { RouteLocation } from '../../context/RouteContext';
import polyline from '@mapbox/polyline';
import { userApi, UserResponse } from '@/services/user';
import { User } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs';

interface MapViewComponentProps {
  userLocation: Location.LocationObject | null;
  selectedLocation: NearbyLocation | null;
  currentRoute: RouteLocation[];
  onMapPress: (event: any) => void;
  mapRef: React.RefObject<MapView>;
  region: Region;
  onRegionChangeComplete: (region: Region) => void;
  nearbyLocations: NearbyLocation[]; // Add nearbyLocations to props
  onMarkerPress: (location: NearbyLocation) => void;
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  userLocation,
  selectedLocation,
  currentRoute,
  onMapPress,
  mapRef,
  region,
  onRegionChangeComplete,
  nearbyLocations,
  onMarkerPress
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<UserResponse[]>([]);
  const [lastFetchedLocation, setLastFetchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const UserImages = {
    default: require('../../../assets/images/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg'),
  };
  console.log(nearbyUsers);
  useEffect(() => {
    const fetchNearbyUsers = async () => {
      try {
        if (!userLocation) return;
        
        // Check if we've already fetched for this location (within a small threshold)
        const threshold = 0.0001; // ~11 meters
        if (lastFetchedLocation && 
            Math.abs(lastFetchedLocation.lat - userLocation.coords.latitude) < threshold &&
            Math.abs(lastFetchedLocation.lng - userLocation.coords.longitude) < threshold) {
          return;
        }

        const users = await userApi.getUsersByCoordinates(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          500 // radius in meters
        );
        
        setNearbyUsers(users);
        setLastFetchedLocation({
          lat: userLocation.coords.latitude,
          lng: userLocation.coords.longitude
        });
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
    };

    fetchNearbyUsers();
  }, [userLocation, lastFetchedLocation]);
    const fetchNearbyUsers = async () => {
      try {
        if (!userLocation) return;
        
        // Check if we've already fetched for this location (within a small threshold)
        const threshold = 0.0001; // ~11 meters
        if (lastFetchedLocation && 
            Math.abs(lastFetchedLocation.lat - userLocation.coords.latitude) < threshold &&
            Math.abs(lastFetchedLocation.lng - userLocation.coords.longitude) < threshold) {
          return;
        }

        const users = await userApi.getUsersByCoordinates(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          500 // radius in meters
        );
        
        setNearbyUsers(users);
        setLastFetchedLocation({
          lat: userLocation.coords.latitude,
          lng: userLocation.coords.longitude
        });
      } catch (error) {
        console.error('Error fetching nearby users:', error);
      }
    };

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        if (!userLocation || !selectedLocation) return;

        const origin = {
          location: {
            latLng: {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            },
          },
        };

        const destination = {
          location: {
            latLng: {
              latitude: selectedLocation.location.latitude,
              longitude: selectedLocation.location.longitude,
            },
          },
        };

        const response = await fetch(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY, // Replace with your API key
              'X-Goog-FieldMask': 'routes.polyline.encodedPolyline', // Specify the fields to return
            },
            body: JSON.stringify({
              origin,
              destination,
              travelMode: 'DRIVE', // Use 'DRIVE', 'BICYCLE', or 'TRANSIT' as needed
              routingPreference: 'TRAFFIC_AWARE', // Optional: Use 'TRAFFIC_AWARE_OPTIMAL' for more accurate traffic data
              computeAlternativeRoutes: false, // Set to true if you want alternative routes
              languageCode: 'en-US', // Optional: Set the language for the response
              units: 'IMPERIAL', // Optional: Use 'METRIC' for metric units
            }),
          }
        );

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const encodedPolyline = data.routes[0].polyline.encodedPolyline;
          const decoded = polyline.decode(encodedPolyline);
          const coordinates = decoded.map(([latitude, longitude]) => ({
            latitude,
            longitude,
          }));
          setRouteCoordinates(coordinates);
        }
      } catch (error) {
        console.error('Error fetching directions:', error);
      }
    };

    fetchRoute();
  }, [userLocation, selectedLocation]);

  useEffect(() => {
    if (!selectedLocation) {
      setRouteCoordinates([]);
    }
  }, [selectedLocation]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        onPress={onMapPress}
      >  
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.latitude || 0,
              longitude: user.longitude || 0,
            }}
            title={user.name}
            description={user.email}
            pinColor="#34A853" // Different color for users
          >
            <Image
  source={UserImages.default}
  style={{ width: 40, height: 40, borderRadius: 20 }}
/>
          </Marker>
        ))}
        {nearbyLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.location.latitude,
              longitude: location.location.longitude,
            }}
            title={location.name}
            description={location.address}
            pinColor="#FF9500"
            onPress={() => onMarkerPress(location)} 
          />
        ))}

        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.location.latitude,
              longitude: selectedLocation.location.longitude,
            }}
            title={selectedLocation.name}
            description={selectedLocation.address}
            pinColor="#FF9500"
          />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default MapViewComponent;
