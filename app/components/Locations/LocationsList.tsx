import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
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
}: LocationsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentRoute } = useRoute();
  const { user, getUsersByLocation } = useUser();
  
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
              const users = await getUsersByLocation(
                location.location.latitude,
                location.location.longitude,
                100 // Small radius in meters to get users at this specific location
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
    
    fetchUserCounts();
  }, [locations, user, getUsersByLocation]);
  
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
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: isDark ? '#ddd' : '#666' }]}>
          No places found nearby. Try adjusting your filters.
        </Text>
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
  },
}); 