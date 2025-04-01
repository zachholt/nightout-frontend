import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '../../types/location';
import { LocationCard } from './LocationCard';
import { useRoute } from '../../context/RouteContext';
import { useUser } from '../../context/UserContext';
import { useLocation } from '../../context/LocationContext';
import { getLocationIcon } from '../../utils/locationUtils';

interface LocationsListProps {
  locations?: NearbyLocation[];
  onLocationPress: (location: NearbyLocation) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export default function LocationsList({
  locations,
  onLocationPress,
  isLoading: isLoadingProp,
  error,
  onRefresh,
}: LocationsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentRoute } = useRoute();
  const { user } = useUser();
  const { 
    usersByLocationId, 
    isLoading: isLoadingContext,
    refreshAllManagedUsers
  } = useLocation();
  
  const isInRoute = (locationId: string) => {
    return currentRoute.some(item => item.id === locationId);
  };
  
  const renderEmptyState = () => {
    const showLoading = isLoadingProp !== undefined ? isLoadingProp : isLoadingContext;
    
    if (showLoading) {
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
  
  if (!Array.isArray(locations) || locations.length === 0) {
    return renderEmptyState();
  }
  
  return (
    <View style={styles.listContainer}>
      {locations.map(item => {
        const userCount = usersByLocationId[item.id]?.length || 0;
        return (
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
            userCount={userCount}
            isAuthenticated={!!user}
            onPress={() => onLocationPress(item)}
            openingHours={item.details?.openingHours}
          />
        );
      })}
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