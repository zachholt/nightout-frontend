import React from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { NearbyLocation, LocationFilters } from '../../types/location';
import LocationsList from '../Locations/LocationsList';
import LocationDetails from '../Locations/LocationDetails';
import LocationFiltersComponent from '../Locations/LocationFilters';
import AddToRouteButton from './AddToRouteButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  snapPoints: string[];
  onSheetChanges: (index: number) => void;
  selectedLocation: NearbyLocation | null;
  locations: NearbyLocation[];
  filters: LocationFilters;
  sortBy: 'distance' | 'rating' | null;
  onFiltersChange: (filters: LocationFilters) => void;
  onSortChange: (sortBy: 'distance' | 'rating' | null) => void;
  onLocationPress: (location: NearbyLocation) => void;
  onLocationClose: () => void;
  isLoading: boolean;
  error: string | null;
  isInRoute: (locationId: string) => boolean;
  onRouteToggle: () => void;
  isDark: boolean;
}

const LocationBottomSheet: React.FC<LocationBottomSheetProps> = ({
  bottomSheetRef,
  snapPoints,
  onSheetChanges,
  selectedLocation,
  locations,
  filters,
  sortBy,
  onFiltersChange,
  onSortChange,
  onLocationPress,
  onLocationClose,
  isLoading,
  error,
  isInRoute,
  onRouteToggle,
  isDark,
}) => {
  const insets = useSafeAreaInsets();

  const renderBottomSheetContent = () => {
    if (selectedLocation) {
      return (
        <View style={{ flex: 1, position: 'relative' }}>
          <LocationDetails
            location={selectedLocation}
            onClose={onLocationClose}
            visible={true}
          />
          {/* Add to Route Button inside bottom sheet */}
          <AddToRouteButton
            location={selectedLocation}
            isInRoute={isInRoute(selectedLocation.id)}
            onToggle={onRouteToggle}
            isDark={isDark}
            insets={insets}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.bottomSheetContent}>
        {/* Fixed Filters at the top */}
        <View style={[
          styles.filtersContainer, 
          { 
            backgroundColor: isDark ? '#1c1c1e' : '#fff',
          }
        ]}>
          <LocationFiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
        </View>
        
        {/* Visual divider */}
        <View style={[
          styles.divider,
          { backgroundColor: isDark ? '#333' : '#e0e0e0' }
        ]} />
        
        {/* Scrollable Location List */}
        <BottomSheetScrollView style={styles.contentContainer}>
          <LocationsList
            locations={locations}
            onLocationPress={onLocationPress}
            isLoading={isLoading}
            error={error}
          />
        </BottomSheetScrollView>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={onSheetChanges}
      backgroundStyle={{ backgroundColor: isDark ? '#1c1c1e' : '#fff' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#666' : '#999' }}
      enableContentPanningGesture={selectedLocation ? false : true}
    >
      {renderBottomSheetContent()}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  filtersContainer: {
    borderBottomWidth: 0,
    padding: 0,
    paddingBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
    zIndex: 10,
  },
  divider: {
    height: 2,
    width: '100%',
    marginTop: 0,
  },
  contentContainer: {
    flex: 1,
    marginTop: 8,
  },
});

export default LocationBottomSheet; 