import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Region, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { NearbyLocation } from '../../types/location';
import { RouteLocation } from '../../context/RouteContext';

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
        {/* Only render marker for selected location */}
        {selectedLocation && (
          <Marker
            key={selectedLocation.id}
            coordinate={{
              latitude: selectedLocation.location.latitude,
              longitude: selectedLocation.location.longitude,
            }}
            title={selectedLocation.name}
            description={selectedLocation.address}
            pinColor="#FF9500" // Orange color to highlight the selected location
          />
        )}
        
        {/* Render route polyline if there are route locations */}
        {currentRoute.length > 1 && userLocation && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              },
              ...currentRoute.map((loc: RouteLocation) => ({
                latitude: loc.latitude,
                longitude: loc.longitude,
              })),
            ]}
            strokeColor="#2196F3"
            strokeWidth={3}
          />
        )}
        
        {/* Render dotted line to selected location */}
        {selectedLocation && userLocation && (
          <Polyline
            coordinates={[
              {
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              },
              {
                latitude: selectedLocation.location.latitude,
                longitude: selectedLocation.location.longitude,
              },
            ]}
            strokeColor="#FF9500"
            strokeWidth={2}
            lineDashPattern={[5, 5]}
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