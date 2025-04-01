import React from 'react';
import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, useColorScheme, NativeScrollEvent, NativeSyntheticEvent, TouchableOpacity, Platform, Text, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { debounce } from 'lodash';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


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
import { useLocation } from '../context/LocationContext';

// MARK: - Main Component
export default function TabOneScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { currentRoute, addToRoute, removeFromRoute } = useRoute();
  const { setManagedLocations } = useLocation();
  const [radius, setRadius] = useState<number>(12000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
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
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1);
  
  // MARK: - Helper Functions
  const isInRoute = (locationId: string) => {
    return currentRoute.some(item => item.id === locationId);
  };
  
  // MARK: - Bottom Sheet Configuration
  const snapPoints = useMemo(() => {
    const minSnapPoint = 60; // Small fixed pixel value for initial peek
    const midSnapPoint = windowHeight * 0.5;
    const topPadding = 20; // Extra padding below the safe area
    const maxSnapPoint = windowHeight - insets.top - topPadding;
    
    // Ensure snap points are distinct and in increasing order
    const adjustedMid = Math.min(midSnapPoint, maxSnapPoint - 100); // Ensure mid is reasonably below max
    const adjustedMin = Math.min(minSnapPoint, adjustedMid - 50);   // Ensure min is reasonably below mid

    return [adjustedMin, adjustedMid, maxSnapPoint]; // Use only pixel values
  }, [windowHeight, insets.top]);
  
  const centerMapOnUser = useCallback((sheetIndex: number) => {
    if (userLocation && mapRef.current) {
      const latitudeOffsets = [0.0005, 0.0025, 0.005]; 
      const latitudeOffset = latitudeOffsets[sheetIndex] ?? 0.0025;

      const targetRegion = {
        latitude: userLocation.coords.latitude - latitudeOffset,
        longitude: userLocation.coords.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };

      mapRef.current.animateToRegion(targetRegion, 500);
    }
  }, [userLocation, region.latitudeDelta, region.longitudeDelta]);
  
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
    setBottomSheetIndex(index);
    centerMapOnUser(index);
  }, [centerMapOnUser]);
  
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 50 && bottomSheetRef.current) {
      bottomSheetRef.current.expand();
    }
  }, []);

  const debouncedFetchLocations = useCallback(
    debounce((currentRadius: number) => {
      try {
        fetchUserLocations(currentRadius);
      } catch (error) {
        console.error('Error in debounced fetch:', error);
        setError('Failed to update search radius. Please try again.');
        setIsLoading(false);
      }
    }, 800),
    []
  );

  // MARK: - Location Services
  useEffect(() => {
    try {
      fetchUserLocations();
    } catch (error) {
      console.error('Error in initial location fetch:', error);
      setError('Failed to fetch locations. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  // Add a listener for app focus to refresh data
  useEffect(() => {
    // Function to run when the app gains focus
    const handleAppFocus = () => {
      console.log('App gained focus - refreshing locations');
      fetchUserLocations();
    };
    
    // Set up a listener for app focus events
    const unsubscribeFocus = navigation.addListener('focus', handleAppFocus);
    
    // Clean up the listener when the component unmounts
    return () => {
      unsubscribeFocus();
    };
  }, [navigation]);
  
  const fetchUserLocations = async (currentRadius?: number) => {
    if (isLoading) {
      console.log('Already loading locations, skipping request');
      return;
    }
    
    const searchRadius = currentRadius !== undefined ? currentRadius : radius;
    const isRadiusChange = currentRadius !== undefined;
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }
      
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced // Less accurate but faster and less resource intensive
      });
      setUserLocation(location);
      
      // Only update the region if this is not a radius change
      // This prevents the map from resetting its zoom after radius change
      if (!isRadiusChange) {
        const initialSheetIndex = 1;
        const latitudeOffsets = [0.0005, 0.0025, 0.005]; 
        const initialLatitudeOffset = latitudeOffsets[initialSheetIndex] ?? 0.0025;
  
        setRegion({
          latitude: location.coords.latitude - initialLatitudeOffset,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
      
      // Add a timeout to prevent API calls from hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
      );
      
      const fetchPromise = fetchNearbyPlaces(
        selectedTypes,
        searchRadius,
        location.coords.latitude,
        location.coords.longitude,
        setIsLoading,
        setError
      );
      
      const places = await Promise.race([fetchPromise, timeoutPromise])
        .catch(error => {
          console.error('Error fetching places:', error);
          setError('Failed to fetch nearby places. Please try again.');
          return [];
        });
      
      if (Array.isArray(places) && places.length > 0) {
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
        setManagedLocations(locationsWithDistance);
      } else {
        setNearbyLocations([]);
        setFilteredLocations([]);
        setManagedLocations([]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please try again.');
      setNearbyLocations([]);
      setFilteredLocations([]);
      setManagedLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      fetchUserLocations();
    }
  }, [selectedTypes]);
  
  useEffect(() => {
    // Only fetch locations on initial mount and when manually triggered
    if (userLocation && nearbyLocations.length === 0) {
      fetchUserLocations();
    }
  }, [userLocation]);
  
  // New useEffect to auto-apply filters when they change 
  useEffect(() => {
    if (userLocation) {
      // Use the modified fetch function but mark it as a filter change
      // to prevent map zoom reset
      const fetchWithFilterChange = async () => {
        // Skip if we don't have any locations yet (first load)
        if (nearbyLocations.length === 0) return;
        
        // Use the fetchUserLocations function with current radius
        // Flag will be set to prevent zoom reset
        fetchUserLocations(radius);
      };
      
      fetchWithFilterChange();
    }
  }, [selectedTypes, filters.openNow]);
  
  useEffect(() => {
    // Only fetch locations on initial mount
    if (userLocation && nearbyLocations.length === 0) {
      fetchUserLocations();
    }
  }, [userLocation]);
  
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
      
      // Center map between user and selected location if user location is available
      if (userLocation) {
        // Calculate midpoint between user and selected location
        const midpointLat = (userLocation.coords.latitude + location.location.latitude) / 2;
        const midpointLng = (userLocation.coords.longitude + location.location.longitude) / 2;
        
        // Calculate distance between points to determine appropriate zoom level
        const latDelta = Math.abs(userLocation.coords.latitude - location.location.latitude) * 1.5;
        const lngDelta = Math.abs(userLocation.coords.longitude - location.location.longitude) * 1.5;
        
        // Ensure minimum zoom level (prevent zooming in too close)
        const minDelta = 0.01;
        
        // Calculate vertical offset based on bottom sheet position
        const latitudeOffsets = [0.0005, 0.002, 0.004];
        const latitudeOffset = latitudeOffsets[bottomSheetIndex] ?? 0.002;
        
        // Animate map to show both user and selected location
        mapRef.current?.animateToRegion({
          latitude: midpointLat - latitudeOffset/2, // Apply partial offset to midpoint
          longitude: midpointLng,
          latitudeDelta: Math.max(latDelta, minDelta),
          longitudeDelta: Math.max(lngDelta, minDelta),
        }, 800);
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

  const handleRadiusChange = (newRadius: number) => {
    console.log('New radius:', newRadius);
    setRadius(newRadius);
    
    // Trigger the debounced fetch for new locations
    debouncedFetchLocations(newRadius);
    
    // Combine radius-based zoom with bottom sheet offset
    if (userLocation && mapRef.current) {
      // Calculate zoom level based on radius
      const milesRadius = newRadius / 1609.34;
      
      // Adjust the map's zoom level (delta) based on the radius
      let latDelta, lngDelta;
      
      // Define zoom levels based on radius in miles
      if (milesRadius <= 1) {
        latDelta = 0.02;
        lngDelta = 0.02;
      } else if (milesRadius <= 5) {
        latDelta = 0.05;
        lngDelta = 0.05;
      } else if (milesRadius <= 10) {
        latDelta = 0.1;
        lngDelta = 0.1;
      } else if (milesRadius <= 20) {
        latDelta = 0.2;
        lngDelta = 0.2;
      } else {
        latDelta = 0.4;
        lngDelta = 0.4;
      }
      
      // Calculate offset based on bottom sheet position
      const latitudeOffsets = [0.0005, 0.0025, 0.005]; 
      const latitudeOffset = latitudeOffsets[bottomSheetIndex] ?? 0.0025;
      
      // Animate to the new region with both zoom AND offset
      mapRef.current.animateToRegion({
        latitude: userLocation.coords.latitude - latitudeOffset,
        longitude: userLocation.coords.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta
      }, 500);
    }
  };
  
  // MARK: - Map Interaction Handlers
  const centerOnUserLocation = useCallback(() => {
    centerMapOnUser(bottomSheetIndex);
  }, [centerMapOnUser, bottomSheetIndex]);
  
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
        radius={radius}
      />
      
      <LocationBottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        onSheetChanges={handleSheetChanges}
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
        onRefresh={() => fetchUserLocations()}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        radius={radius}
        onRadiusChange={handleRadiusChange}
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
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 15,
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  locationIcon: {
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },
});