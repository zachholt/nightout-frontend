import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Image, Text, Animated } from 'react-native';
import MapView, { Region, Marker, Polyline, Callout, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { NearbyLocation } from '../../types/location';
import { RouteLocation } from '../../context/RouteContext';
import polyline from '@mapbox/polyline';
import { useUser, User } from '@/app/context/UserContext';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs';

interface MapViewComponentProps {
  userLocation: Location.LocationObject | null;
  selectedLocation: NearbyLocation | null;
  currentRoute: RouteLocation[];
  onMapPress: (event: any) => void;
  mapRef: React.RefObject<MapView>;
  region: Region;
  onRegionChangeComplete: (region: Region) => void;
  nearbyLocations: NearbyLocation[];
  onMarkerPress: (location: NearbyLocation) => void;
  radius: number;
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
  onMarkerPress,
  radius,
}) => {
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const { nearbyUsers } = useUser();
  const [showRadiusCircle, setShowRadiusCircle] = useState(true);
  const [circleOpacity, setCircleOpacity] = useState(1);

  useEffect(() => {
    setShowRadiusCircle(true);
    setCircleOpacity(1);
    const timer = setTimeout(() => {
      const fadeInterval = setInterval(() => {
        setCircleOpacity(prev => {
          const newOpacity = Math.max(0, prev - 0.1);
          if (newOpacity <= 0) {
            clearInterval(fadeInterval);
            setShowRadiusCircle(false);
          }
          return newOpacity;
        });
      }, 50);
      return () => {
        clearInterval(fadeInterval);
      };
    }, 5000);
    return () => clearTimeout(timer);
  }, [radius]);

  const UserImages = {
    default: require('../../../assets/images/307ce493-b254-4b2d-8ba4-d12c080d6651.jpg'),
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
              'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
              'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
            },
            body: JSON.stringify({
              origin,
              destination,
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
              computeAlternativeRoutes: false,
              languageCode: 'en-US',
              units: 'IMPERIAL',
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
        {userLocation && showRadiusCircle && (
          <>
            <Circle
              center={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              radius={radius}
              strokeColor={`rgba(32, 157, 188, ${circleOpacity * 0.6})`}
              fillColor={`rgba(32, 157, 188, ${circleOpacity * 0.08})`}
              strokeWidth={2}
            />
            
            <Circle
              center={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              radius={radius * 0.25}
              strokeColor={`rgba(32, 157, 188, ${circleOpacity * 0.4})`}
              fillColor={`rgba(32, 157, 188, ${circleOpacity * 0.15})`}
              strokeWidth={1}
            />
            
            <Circle
              center={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              radius={radius * 1.1}
              strokeColor={`rgba(32, 157, 188, ${circleOpacity * 0.3})`}
              fillColor="transparent"
              strokeWidth={1.5}
            />
          </>
        )}
        
        {nearbyUsers.map((user: User) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.latitude || 0,
              longitude: user.longitude || 0,
            }}
            tracksViewChanges={false}
          >
            <View style={styles.userMarkerContainer}>
              <Image
                source={UserImages.default}
                style={styles.userMarkerImage}
              />
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{user.name}</Text>
              </View>
            </Callout>
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
            tracksViewChanges={false}
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
            tracksViewChanges={false}
          />
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#007AFF"
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
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarkerContainer: {
    backgroundColor: 'white',
    padding: 3,
    borderRadius: 15,
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  userMarkerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  calloutContainer: {
    width: 120,
    padding: 6,
    alignItems: 'center',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  calloutSubtitle: {
    fontSize: 12,
    color: 'gray',
  },
});

export default MapViewComponent;
