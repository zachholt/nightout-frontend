import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { NearbyLocation } from '../../types/location';
import { LocationCard } from './LocationCard';
import { useRoute } from '../../context/RouteContext';
import { getLocationIcon } from '../../utils/locationUtils';

interface LocationsListProps {
  locations: NearbyLocation[];
  onLocationPress: (location: NearbyLocation) => void;
  isLoading: boolean;
  error: string | null;
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
  
  const isInRoute = (locationId: string) => {
    return currentRoute.some(item => item.id === locationId);
  };
  
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
          onPress={() => onLocationPress(item)}
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