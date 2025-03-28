import React from 'react';
import { View, StyleSheet, useColorScheme, Platform, TouchableOpacity, Text } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { NearbyLocation, LocationFilters } from '../../types/location';
import LocationsList from '../Locations/LocationsList';
import LocationDetails from '../Locations/LocationDetails';
import LocationFiltersComponent from '../Locations/LocationFilters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {RadiusSlider} from '../RadiusSlider';

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
  onRefresh?: () => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
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
  radius,
  onRadiusChange,
  selectedTypes,
  onTypesChange,
}) => {
  const insets = useSafeAreaInsets();

  const locationTypes = [
    { id: 'bar', label: 'Bar' },
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'night_club', label: 'Club' },
    { id: 'hotel', label: 'Hotel' }
  ];

  const toggleType = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    onTypesChange(newTypes);
  };

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
        {/* Fixed Filters at the top */}
        <View style={[
          styles.filtersContainer, 
          { 
            backgroundColor: isDark ? '#1c1c1e' : '#fff',
          }
        ]}>

          {/* Type Filter Buttons */}
          <View style={styles.typeButtonsContainer}>
            {locationTypes.map(type => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: selectedTypes.includes(type.id)
                      ? isDark ? '#444' : '#ddd'
                      : isDark ? '#2c2c2e' : '#f5f5f5',
                    borderColor: isDark ? '#555' : '#ccc',
                  },
                ]}
                onPress={() => toggleType(type.id)}
              >
                <Text style={{ color: isDark ? '#fff' : '#000' }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <LocationFiltersComponent
            filters={filters}
            onFiltersChange={onFiltersChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
          <RadiusSlider 
            radius={radius}
            onRadiusChange={onRadiusChange}
            isDark={isDark}
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
    paddingBottom: 8, // Increased bottom padding
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
  typeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16, // Added horizontal padding
    paddingVertical: 12, // Added vertical padding
    paddingBottom: 8, // Space below buttons
  },
  typeButton: {
    paddingVertical: 10, // Increased vertical padding
    paddingHorizontal: 12, // Increased horizontal padding
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 90, // Slightly wider buttons
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4, // Space between buttons
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContent: {
    paddingHorizontal: 16, // Match the buttons padding
    paddingTop: 8, // Space above filters
  },
  divider: {
    height: 1, // Thinner divider
    width: '100%',
    marginVertical: 8, // Space above and below divider
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8, // Space at top of scroll view
    paddingBottom: 16, // Space at bottom
    paddingHorizontal: 16, // Side padding
  },
});

export default LocationBottomSheet; 