import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteLocation } from '../context/RouteContext';
import { useCheckIn } from '../components/context/CheckInContext'; // Import the CheckInContext
import * as Location from 'expo-location';
import DraggableFlatList, { 
  ScaleDecorator, 
  RenderItemParams 
} from 'react-native-draggable-flatlist';
import LocationCard from '../components/Locations/LocationCard'; // Import the LocationCard component

// Define a type for travel mode
type TravelMode = 'walking' | 'driving';

// Define a type for route segment
type RouteSegment = {
  startLocation: RouteLocation;
  endLocation: RouteLocation;
  distance: string;
  duration: string;
};

export default function RoutesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const backgroundColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBackground = isDark ? '#2C2C2E' : '#F5F5F5';
  const accentColor = '#007AFF';

  // Get route context
  const { currentRoute, savedRoutes, removeFromRoute, clearRoute, saveRoute, updateRoute } = useRoute();

  // Get checked-in locations from CheckInContext
  const { state: checkInState } = useCheckIn();
  const checkedInLocations = checkInState.checkIns.map((checkIn) => checkIn.location);

  // State
  const [routeName, setRouteName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [totalDistance, setTotalDistance] = useState('');
  const [totalDuration, setTotalDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // Get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({});
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  // Calculate route information when currentRoute changes
  useEffect(() => {
    if (currentRoute.length > 1) {
      calculateRouteInfo();
      console.log('Calculating route info for', currentRoute.length, 'locations');
    } else {
      setTotalDistance('');
      setTotalDuration('');
    }
  }, [currentRoute]);

  // Calculate route information using Google Directions API
  const calculateRouteInfo = async () => {
    if (currentRoute.length < 2) return;
    
    setIsLoading(true);
    
    try {
      let totalDistanceValue = 0;
      let totalDurationValue = 0;
      
      // Calculate route segments
      for (let i = 0; i < currentRoute.length - 1; i++) {
        const start = currentRoute[i];
        const end = currentRoute[i + 1];
        
        console.log(`Fetching directions from ${start.name} to ${end.name}`);
        
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&mode=walking&key=AIzaSyBqIBvHNZL-QLFePoxHvc0PMID5k8YVhFs`
          );
          
          const data = await response.json();
          console.log('API response status:', data.status);
          
          if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];
            
            totalDistanceValue += leg.distance.value;
            totalDurationValue += leg.duration.value;
          }
        } catch (error) {
          console.error('Error fetching directions:', error);
        }
      }
      
      // Format total distance and duration
      if (totalDistanceValue > 0) {
        setTotalDistance(formatDistance(totalDistanceValue));
        setTotalDuration(formatDuration(totalDurationValue));
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format distance in meters to a readable string
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };
  
  // Format duration in seconds to a readable string
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  };

  // Handle save route
  const handleSaveRoute = () => {
    if (routeName.trim() === '') {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }
    
    saveRoute(routeName);
    setRouteName('');
    setShowSaveDialog(false);
  };

  // Handle reordering of locations
  const handleReorder = useCallback((data: RouteLocation[]) => {
    // Create a new array with the reordered locations
    const newRoute = [...data];
    
    // Update the route context with the new order
    updateRoute(newRoute);
    
    // Recalculate route information with the new order
    // We'll delay this to prevent UI jank
    setTimeout(() => {
      calculateRouteInfo();
    }, 100);
  }, [updateRoute, calculateRouteInfo]);

  // Render current route
  const renderCurrentRoute = () => {
    if (currentRoute.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
          <Ionicons name="map-outline" size={48} color={accentColor} />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No locations added to your route yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: textColor }]}>
            Add locations from the map to plan your night out
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.currentRouteContainer}>
        {/* Route summary */}
        {isLoading ? (
          <View style={[styles.summaryContainer, { backgroundColor: cardBackground }]}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Calculating route...
            </Text>
          </View>
        ) : (
          <View style={[styles.summaryContainer, { backgroundColor: cardBackground }]}>
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={20} color={accentColor} />
              <Text style={[styles.summaryText, { color: textColor }]}>
                {currentRoute.length} {currentRoute.length === 1 ? 'stop' : 'stops'} in your route
              </Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Ionicons name="information-circle-outline" size={16} color={accentColor} style={{ marginLeft: 2 }} />
              <Text style={[styles.summarySubtext, { color: textColor, marginLeft: 8 }]}>
                Press and hold a location, then drag to reorder
              </Text>
            </View>
            {totalDistance && totalDuration && (
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Ionicons name="navigate-outline" size={16} color={accentColor} style={{ marginLeft: 2 }} />
                <Text style={[styles.summarySubtext, { color: textColor, marginLeft: 8 }]}>
                  Total: {totalDistance} • {totalDuration}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Location list */}
        <View style={styles.locationListContainer}>
          <DraggableFlatList
            data={currentRoute}
            onDragBegin={() => {
              setIsDragging(true);
            }}
            onDragEnd={({ data }) => {
              setIsDragging(false);
              handleReorder(data);
            }}
            keyExtractor={(item: RouteLocation) => item.id}
            contentContainerStyle={styles.draggableListContent}
            style={styles.draggableList}
            renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<RouteLocation>) => {
              // Use getIndex() to get the real-time index during dragging, with fallback
              let index = 0;
              if (typeof getIndex === 'function') {
                const result = getIndex();
                if (result !== undefined) {
                  index = result;
                } else {
                  index = currentRoute.findIndex(location => location.id === item.id);
                }
              } else {
                index = currentRoute.findIndex(location => location.id === item.id);
              }
              
              return (
                <ScaleDecorator>
                  <View style={[
                    styles.locationItemWrapper,
                    isActive && styles.locationItemWrapperActive
                  ]}>
                    {/* Location card */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onLongPress={drag}
                      disabled={isActive}
                      style={[
                        styles.locationItem, 
                        { backgroundColor: cardBackground },
                        isActive && styles.locationItemActive
                      ]}
                    >
                      <Animated.View style={[
                        styles.locationIndex,
                        isActive && { backgroundColor: '#FF9500' } // Change color when active
                      ]}>
                        <Text style={styles.indexNumber}>{index + 1}</Text>
                      </Animated.View>
                      <View style={styles.locationInfo}>
                        <Text style={[styles.locationName, { color: textColor }]}>{item.name}</Text>
                        <Text style={styles.locationAddress}>{item.address}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFromRoute(item.id)}
                        disabled={isActive || isDragging} // Disable remove button while dragging
                      >
                        <Ionicons name="close-circle" size={24} color={(isActive || isDragging) ? "#AAAAAA" : "#FF3B30"} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                </ScaleDecorator>
              );
            }}
          />
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => clearRoute()}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: accentColor }]}
            onPress={() => setShowSaveDialog(true)}
          >
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
        
        {/* Save dialog */}
        {showSaveDialog && (
          <View style={styles.saveDialogOverlay}>
            <View style={[styles.saveDialog, { backgroundColor: backgroundColor }]}>
              <Text style={[styles.saveDialogTitle, { color: textColor }]}>Save Route</Text>
              <TextInput
                style={[styles.saveDialogInput, { color: textColor, borderColor: isDark ? '#444' : '#DDD' }]}
                placeholder="Enter route name"
                placeholderTextColor="#999"
                value={routeName}
                onChangeText={setRouteName}
              />
              <View style={styles.saveDialogButtons}>
                <TouchableOpacity
                  style={[styles.saveDialogButton, { backgroundColor: '#FF3B30' }]}
                  onPress={() => setShowSaveDialog(false)}
                >
                  <Text style={styles.saveDialogButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveDialogButton, { backgroundColor: accentColor }]}
                  onPress={handleSaveRoute}
                >
                  <Text style={styles.saveDialogButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render checked-in events
  const renderCheckedInEvents = () => {
    if (checkedInLocations.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: cardBackground }]}>
          <Ionicons name="checkmark-circle-outline" size={48} color={accentColor} />
          <Text style={[styles.emptyStateText, { color: textColor }]}>
            No checked-in locations yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: textColor }]}>
            Check in at locations from the map to see them here
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.checkedInContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Checked-In Events</Text>
        <View style={styles.listContainer}>
          {checkedInLocations.map((item) => (
            <LocationCard
              location={item}
              key={item.id}
              name={item.name}
              distance={item.distance}
              address={item.address}
              iconName="beer-outline"
              isOpenNow={item.isOpenNow}
              rating={item.rating}
              isInRoute={false} // Not used in this context
              onPress={() => {}} // No action needed for checked-in events
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>Your Route</Text>
      {renderCurrentRoute()}
      {renderCheckedInEvents()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  currentRouteContainer: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 24,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  summaryContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  summarySubtext: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  locationListContainer: {
    marginBottom: 16,
    overflow: 'visible',
    width: '110%',
    alignSelf: 'center',
  },
  locationItemWrapper: {
    width: '90%',
    marginBottom: 8,
    overflow: 'visible',
    alignSelf: 'center',
  },
  locationItemWrapperActive: {
    zIndex: 1000,
  },
  locationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  locationItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    transform: [{ scale: 1.02 }],
    zIndex: 999,
  },
  locationIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  indexNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  saveDialogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  saveDialog: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
  },
  saveDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  saveDialogInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  saveDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveDialogButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  saveDialogButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  draggableList: {
    width: '100%',
  },
  draggableListContent: {
    paddingBottom: 16,
    width: '100%',
  },
  checkedInContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 16,
  },
});