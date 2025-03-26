import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '../../types/location';
import { LocationCard } from './LocationCard';
import { useRoute } from '../../context/RouteContext';
import { useUser } from '../../context/UserContext';
import { getLocationIcon } from '../../utils/locationUtils';

interface LocationsListProps {
  locations: NearbyLocation[];
  onLocationPress: (location: NearbyLocation) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

// Interface for tracking user counts at locations
interface LocationUserCounts {
  [locationId: string]: number;
}

export default function LocationsList({
  locations,
  onLocationPress,
  isLoading,
  error,
  onRefresh,
}: LocationsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentRoute } = useRoute();
  const { user, getUsersAtLocation } = useUser();
  
  // State to track user counts at each location
  const [userCounts, setUserCounts] = useState<LocationUserCounts>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  
  const isInRoute = (locationId: string) => {
    return currentRoute.some(item => item.id === locationId);
  };
  
  // Fetch user counts for all locations
  useEffect(() => {
    const fetchUserCounts = async () => {
      if (!user || locations.length === 0) return;
      
      setIsLoadingCounts(true);
      
      try {
        const counts: LocationUserCounts = {};
        
        // Process locations in batches to avoid too many simultaneous requests
        const batchSize = 5;
        for (let i = 0; i < locations.length; i += batchSize) {
          const batch = locations.slice(i, i + batchSize);
          
          // Create an array of promises for each location in the batch
          const promises = batch.map(async (location) => {
            try {
              // Use the new method that specifically gets users at a location
              const users = await getUsersAtLocation(
                location.location.latitude,
                location.location.longitude,
                100 // Radius in meters to get users at this specific location
              );
              
              counts[location.id] = users.length;
            } catch (error) {
              console.error(`Error fetching users for location ${location.id}:`, error);
              counts[location.id] = 0;
            }
          });
          
          // Wait for all promises in this batch to resolve
          await Promise.all(promises);
        }
        
        setUserCounts(counts);
      } catch (error) {
        console.error('Error fetching user counts:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    };
    
    // Initial fetch
    fetchUserCounts();

    // Set up a refresh when returning to the screen
    const refreshTimer = setTimeout(() => {
      fetchUserCounts();
    }, 500);

    // Set up an AppState listener to refresh when app comes to foreground
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground - refreshing locations');
        fetchUserCounts();
      }
    };

    // Add AppState change listener
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Set up a periodic refresh every 10 seconds while the component is mounted
    const periodicRefresh = setInterval(() => {
      fetchUserCounts();
    }, 10000);

    return () => {
      clearTimeout(refreshTimer);
      clearInterval(periodicRefresh);
      appStateSubscription.remove(); // Clean up the AppState listener
    };
  }, [locations, user, getUsersAtLocation, user?.latitude, user?.longitude]);
  
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={[styles.emptyText, { color: isDark ? '#ddd' : '#666' }]}>
            Finding places near you...
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: isDark ? '#ddd' : '#666' }]}>
            {error}
          </Text>
          {onRefresh && (
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} 
              onPress={onRefresh}
            >
              <Ionicons name="refresh" size={18} color={isDark ? '#fff' : '#333'} />
              <Text style={[styles.refreshButtonText, { color: isDark ? '#fff' : '#333' }]}>
                Refresh
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: isDark ? '#ddd' : '#666' }]}>
          No places found nearby. Try adjusting your filters.
        </Text>
        {onRefresh && (
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]} 
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={18} color={isDark ? '#fff' : '#333'} />
            <Text style={[styles.refreshButtonText, { color: isDark ? '#fff' : '#333' }]}>
              Refresh
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  if (locations.length === 0) {
    return renderEmptyState();
  }
  
  return (
    <View style={styles.listContainer}>
      {locations.map(item => (
        <LocationCard
          location={item}
          key={item.id}
          name={item.name}
          type={item.type}
          distance={item.distance}
          address={item.address}
          iconName={getLocationIcon(item.type)}
          isOpenNow={item.isOpenNow}
          rating={item.rating}
          isInRoute={isInRoute(item.id)}
          userCount={userCounts[item.id] || 0}
          isAuthenticated={!!user}
          onPress={() => onLocationPress(item)}
          openingHours={item.details?.openingHours}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingVertical: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 