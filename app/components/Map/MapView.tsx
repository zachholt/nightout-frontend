import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Region, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { NearbyLocation } from '../../types/location';
import { RouteLocation } from '../../context/RouteContext';
import polyline from '@mapbox/polyline';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs';

interface MapViewComponentProps {
  userLocation: Location.LocationObject | null;
  selectedLocation: NearbyLocation | null;
  currentRoute: RouteLocation[];
  onMapPress: (event: any) => void;
  mapRef: React.RefObject<MapView>;
  region: Region;
  onRegionChangeComplete: (region: Region) => void;
}

const MapViewComponent: React.FC<MapViewComponentProps> = ({
  userLocation,
  selectedLocation,
  currentRoute,
  onMapPress,
  mapRef,
  region,
  onRegionChangeComplete,
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

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
