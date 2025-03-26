import React from 'react';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, useColorScheme, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, Platform, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';

// Import types
import { NearbyLocation, LocationFilters } from '../types/location';

// Import components
import MapViewComponent from '../components/Map/MapView';
import LocationBottomSheet from '../components/BottomSheet/LocationBottomSheet';

// Import utilities
import { getDistanceInMiles } from '../utils/locationUtils';
import { fetchNearbyPlaces, fetchPlaceDetails } from '../utils/apiUtils';

// Import context
import { useRoute, RouteLocation } from '../context/RouteContext';

// MARK: - Main Component
export default function TabOneScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { currentRoute, addToRoute, removeFromRoute } = useRoute();
  
  // MARK: - State Variables
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<NearbyLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<NearbyLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LocationFilters>({
    openNow: false,
  });
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | null>('distance');
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1); // Track bottom sheet index
  
  // MARK: - Helper Functions
  const isInRoute = (locationId: string) => {
    return currentRoute.some(item => item.id === locationId);
  };
  
  // MARK: - Bottom Sheet Configuration
  const snapPoints = useMemo(() => ['3%','50%', '100%'], []);
  
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
    setBottomSheetIndex(index);
    
    if (userLocation) {
      const latitudeOffset = index === 1 ? 0.0025 : 0;
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude - latitudeOffset,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [userLocation]);
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 50 && bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  // MARK: - Location Services
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }
      
      try {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        
        const latitudeOffset = 0.0025;
        
        setRegion({
          latitude: location.coords.latitude - latitudeOffset,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        const places = await fetchNearbyPlaces(
          location.coords.latitude,
          location.coords.longitude,
          setIsLoading,
          setError
        );
        
        const locationsWithDistance = places.map(place => ({
          ...place,
          distance: getDistanceInMiles(
            location.coords.latitude,
            location.coords.longitude,
            place.location.latitude,
            place.location.longitude
          ),
        }));
        
        locationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setNearbyLocations(locationsWithDistance);
        setFilteredLocations(locationsWithDistance);
      } catch (error) {
        console.error('Error getting location:', error);
        setError('Failed to get your location. Please try again.');
      }
    })();
  }, []);
  
  // MARK: - Filtering and Sorting
  useEffect(() => {
    if (nearbyLocations.length === 0) return;
    
    let filtered = [...nearbyLocations];
    
    if (filters.openNow) {
      filtered = filtered.filter(location => location.isOpenNow);
    }
    
    if (sortBy === 'distance') {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setFilteredLocations(filtered);
  }, [nearbyLocations, filters, sortBy]);
  
  // MARK: - Location Interaction Handlers
  const handleLocationPress = async (location: NearbyLocation) => {
    console.log('Location pressed:', location.name);
    
    try {
      let locationWithDetails = location;
      
      if (!location.details) {
        console.log('Fetching details for:', location.name);
        const details = await fetchPlaceDetails(location.id, setError);
        
        if (details) {
          locationWithDetails = {
            ...location,
            details,
          };
          
          setNearbyLocations(prevLocations =>
            prevLocations.map(loc => (loc.id === location.id ? locationWithDetails : loc))
          );
          
          setFilteredLocations(prevLocations =>
            prevLocations.map(loc => (loc.id === location.id ? locationWithDetails : loc))
          );
        }
      }
      
      setSelectedLocation(locationWithDetails);
      
      if (userLocation) {
        const latitudeOffset = bottomSheetIndex === 1 ? 0.0025 : 0;
        
        const centerLat = (userLocation.coords.latitude - latitudeOffset + location.location.latitude) / 2;
        const centerLng = (userLocation.coords.longitude + location.location.longitude) / 2;
        
        const latDelta = Math.abs(userLocation.coords.latitude - location.location.latitude) * 1.5;
        const lngDelta = Math.abs(userLocation.coords.longitude - location.location.longitude) * 1.5;
        
        const minDelta = 0.01;
        
        mapRef.current?.animateToRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta, minDelta),
          longitudeDelta: Math.max(lngDelta, minDelta),
        }, 1000);
      }
      
    } catch (error) {
      console.error('Error in handleLocationPress:', error);
      setError('Failed to fetch place details. Please try again.');
    }
  };
  
  const handleLocationClose = () => {
    console.log('Closing location details');
    setSelectedLocation(null);
  };
  
  const handleFiltersChange = (newFilters: LocationFilters) => {
    setFilters(newFilters);
  };
  
  const handleSortChange = (newSortBy: 'distance' | 'rating' | null) => {
    setSortBy(newSortBy);
  };
  
  // MARK: - Map Interaction Handlers
  const centerOnUserLocation = useCallback(() => {
    if (userLocation) {
      const latitudeOffset = bottomSheetIndex === 1 ? 0.0025 : 0;
      
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude - latitudeOffset,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [userLocation, bottomSheetIndex]);
  
  const findClosestLocation = (coordinate: { latitude: number; longitude: number }) => {
    if (!userLocation || filteredLocations.length === 0) return null;
    
    const locationsWithTapDistance = filteredLocations.map(location => {
      const distance = getDistanceInMiles(
        coordinate.latitude,
        coordinate.longitude,
        location.location.latitude,
        location.location.longitude
      );
      return { location, distance };
    });
    
    locationsWithTapDistance.sort((a, b) => a.distance - b.distance);
    
    const closest = locationsWithTapDistance[0];
    if (closest && closest.distance < 0.1) {
      return closest.location;
    }
    
    return null;
  };
  
  const handleMapPress = (event: any) => {
    if (event.nativeEvent.action !== 'press') return;
    
    const tappedCoordinate = event.nativeEvent.coordinate;
    const closestLocation = findClosestLocation(tappedCoordinate);
    
    if (closestLocation) {
      handleLocationPress(closestLocation);
    } else if (selectedLocation) {
      setSelectedLocation(null);
    }
  };
  
  // MARK: - Route Management
  const handleRouteToggle = () => {
    if (!selectedLocation) return;
    
    const locationId = selectedLocation.id;
    
    if (isInRoute(locationId)) {
      removeFromRoute(locationId);
    } else {
      addToRoute({
        id: locationId,
        placeId: locationId,
        name: selectedLocation.name,
        address: selectedLocation.address,
        latitude: selectedLocation.location.latitude,
        longitude: selectedLocation.location.longitude,
        locationType: selectedLocation.type,
      });
    }
  };
  
  // MARK: - Main Render
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <MapViewComponent
        userLocation={userLocation}
        selectedLocation={selectedLocation}
        currentRoute={currentRoute}
        onMapPress={handleMapPress}
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={setRegion}
        nearbyLocations={filteredLocations} 
        onMarkerPress={handleLocationPress}
      />
      
      <LocationBottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={['25%', '50%', '75%']}
        onSheetChanges={() => {}}
        selectedLocation={selectedLocation}
        locations={filteredLocations}
        filters={filters}
        sortBy={sortBy}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
        onLocationPress={handleLocationPress}
        onLocationClose={handleLocationClose}
        isLoading={isLoading}
        error={error}
        isInRoute={isInRoute}
        onRouteToggle={handleRouteToggle}
        isDark={isDark}
      />
    </GestureHandlerRootView>
  );
}

// MARK: - Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  headerButton: {
    marginRight: 15,
  },
});