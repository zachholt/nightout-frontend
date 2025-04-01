import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { NearbyLocation, LocationFilters } from '../../types/location';
import LocationsList from '../Locations/LocationsList';
import LocationDetails from '../Locations/LocationDetails';
import LocationFiltersComponent from '../Locations/LocationFilters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  snapPoints: (string | number)[];
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
  onRefresh?: () => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  radius: number;
  onRadiusChange: (value: number) => void;
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
  onRefresh,
  selectedTypes,
  onTypesChange,
  radius,
  onRadiusChange,
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
            onRouteToggle={onRouteToggle}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.bottomSheetContent}>
        {/* Filters Section */}
        <View style={[
          styles.filtersContainer, 
          { backgroundColor: isDark ? '#1c1c1e' : '#fff' }
        ]}>
          <LocationFiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            selectedTypes={selectedTypes}
            onTypesChange={onTypesChange}
            radius={radius}
            onRadiusChange={onRadiusChange}
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
            onRefresh={onRefresh}
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
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      enableHandlePanningGesture={true}
      enableOverDrag={false}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 10,
      },
    }),
    zIndex: 10,
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: 0,
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
  },
});

export default LocationBottomSheet; 