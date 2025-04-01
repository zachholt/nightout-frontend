import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationFilters as LocationFiltersType } from '../../types/location';

// Location type definition
const LOCATION_TYPES = [
  { id: 'bar', label: 'Bar', icon: 'beer' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant' },
  { id: 'night_club', label: 'Club', icon: 'wine' },
  { id: 'hotel', label: 'Hotel', icon: 'bed' }
];

// --- Radius Presets --- 
const METERS_PER_MILE = 1609.34;
// Define presets in miles and their corresponding approximate meter values (rounded)
const RADIUS_PRESETS = [
  { miles: 5, meters: Math.round(5 * METERS_PER_MILE / 100) * 100 },     // ~8000m
  { miles: 10, meters: Math.round(10 * METERS_PER_MILE / 100) * 100 },   // ~16100m
  { miles: 20, meters: Math.round(20 * METERS_PER_MILE / 100) * 100 },   // ~32200m
  { miles: 50, meters: Math.round(50 * METERS_PER_MILE / 100) * 100 },   // ~80500m
  { miles: 100, meters: Math.round(100 * METERS_PER_MILE / 100) * 100 }  // ~161000m
];
// Tolerance for matching preset buttons to the current radius state
const RADIUS_MATCH_TOLERANCE = 100; // +/- 100 meters

interface LocationFiltersProps {
  filters: LocationFiltersType;
  onFiltersChange: (filters: LocationFiltersType) => void;
  sortBy: 'distance' | 'rating' | null;
  onSortChange: (sortBy: 'distance' | 'rating' | null) => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  selectedTypes?: string[];
  onTypesChange?: (types: string[]) => void;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  radius,
  onRadiusChange,
  selectedTypes = [],
  onTypesChange = () => {},
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const primaryBlue = '#2196F3';
  const lightBlue = '#E3F2FD';
  const darkBlue = '#1976D2';
  const textColor = isDark ? '#fff' : '#000';
  const mutedTextColor = isDark ? '#999' : '#666';
  
  const toggleOpenNow = () => {
    onFiltersChange({
      openNow: !filters.openNow,
    });
  };
  
  const handleSortByDistance = () => {
    onSortChange(sortBy === 'distance' ? null : 'distance');
  };
  
  const handleSortByRating = () => {
    onSortChange(sortBy === 'rating' ? null : 'rating');
  };

  const toggleType = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    onTypesChange(newTypes);
  };
  
  // Function to determine if a type button should appear selected
  const isTypeSelected = (typeId: string) => {
    // If nothing is selected, all buttons appear selected
    if (selectedTypes.length === 0) {
      return true;
    }
    // Otherwise, only show as selected if explicitly chosen
    return selectedTypes.includes(typeId);
  };
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1c1c1e' : '#fff' }
    ]}>
      {/* Location Type Filters */}
      <View style={styles.typeFiltersContainer}>
        {LOCATION_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              { 
                backgroundColor: isTypeSelected(type.id) 
                  ? primaryBlue 
                  : isDark ? '#2A2A2A' : lightBlue,
                borderColor: isTypeSelected(type.id) 
                  ? darkBlue 
                  : isDark ? '#444' : '#D0D0D0',
              }
            ]}
            onPress={() => toggleType(type.id)}
          >
            <Ionicons
              name={type.icon as any}
              size={16}
              color={isTypeSelected(type.id) ? '#fff' : isDark ? '#fff' : primaryBlue}
            />
            <Text
              style={[
                styles.filterText,
                { 
                  color: isTypeSelected(type.id) ? '#fff' : isDark ? '#fff' : primaryBlue,
                  fontWeight: isTypeSelected(type.id) ? '600' : '500',
                }
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Show hint text when all types are shown (nothing selected) */}
      {selectedTypes.length === 0 && (
        <Text style={[styles.hintText, { color: mutedTextColor }]}>
          Showing all venue types. Select specific types to filter.
        </Text>
      )}

      {/* Filter/Sort/Radius Row */}
      <View style={styles.filterSortRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingRight: 5 }]}
        >
          {/* Open Now Filter */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: filters.openNow 
                  ? primaryBlue 
                  : isDark ? '#2A2A2A' : lightBlue,
                borderColor: filters.openNow 
                  ? darkBlue 
                  : isDark ? '#444' : '#D0D0D0',
              }
            ]}
            onPress={toggleOpenNow}
          >
            <Ionicons
              name="time"
              size={16}
              color={filters.openNow ? '#fff' : isDark ? '#fff' : primaryBlue}
            />
            <Text
              style={[
                styles.filterText,
                { 
                  color: filters.openNow ? '#fff' : isDark ? '#fff' : primaryBlue,
                  fontWeight: filters.openNow ? '600' : '500',
                }
              ]}
            >
              Open Now
            </Text>
          </TouchableOpacity>
          
          {/* Sort Label */}
          <Text style={[styles.sortLabel, { color: mutedTextColor }]}>Sort:</Text>
          
          {/* Sort by Distance */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: sortBy === 'distance' 
                  ? primaryBlue 
                  : isDark ? '#2A2A2A' : lightBlue,
                borderColor: sortBy === 'distance' 
                  ? darkBlue 
                  : isDark ? '#444' : '#D0D0D0',
              }
            ]}
            onPress={handleSortByDistance}
          >
            <Ionicons
              name="navigate"
              size={16}
              color={sortBy === 'distance' ? '#fff' : isDark ? '#fff' : primaryBlue}
            />
            <Text
              style={[
                styles.filterText,
                { 
                  color: sortBy === 'distance' ? '#fff' : isDark ? '#fff' : primaryBlue,
                  fontWeight: sortBy === 'distance' ? '600' : '500',
                }
              ]}
            >
              Nearest
            </Text>
          </TouchableOpacity>
          
          {/* Sort by Rating */}
          <TouchableOpacity
            style={[
              styles.filterButton,
              { 
                backgroundColor: sortBy === 'rating' 
                  ? primaryBlue 
                  : isDark ? '#2A2A2A' : lightBlue,
                borderColor: sortBy === 'rating' 
                  ? darkBlue 
                  : isDark ? '#444' : '#D0D0D0',
              }
            ]}
            onPress={handleSortByRating}
          >
            <Ionicons
              name="star"
              size={16}
              color={sortBy === 'rating' ? '#fff' : isDark ? '#fff' : primaryBlue}
            />
            <Text
              style={[
                styles.filterText,
                { 
                  color: sortBy === 'rating' ? '#fff' : isDark ? '#fff' : primaryBlue,
                  fontWeight: sortBy === 'rating' ? '600' : '500',
                }
              ]}
            >
              Top Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Radius Buttons Section */}
      <View style={[styles.filterSortRow, { marginTop: 8 }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingRight: 5 }]}
        >
          <Text style={[styles.radiusLabel, { color: mutedTextColor }]}>Radius:</Text>
          {RADIUS_PRESETS.map((preset) => {
            // Check if the current radius is close enough to this preset
            const isActive = Math.abs(radius - preset.meters) < RADIUS_MATCH_TOLERANCE;
            return (
              <TouchableOpacity
                key={preset.miles}
                style={[
                  styles.filterButton, // Reuse filter button style
                  styles.radiusButton, // Add specific radius button styling
                  { 
                    backgroundColor: isActive 
                      ? primaryBlue 
                      : isDark ? '#2A2A2A' : lightBlue,
                    borderColor: isActive 
                      ? darkBlue 
                      : isDark ? '#444' : '#D0D0D0',
                  }
                ]}
                onPress={() => onRadiusChange(preset.meters)} // Call handler with meters
              >
                <Text
                  style={[
                    styles.filterText, // Reuse filter text style
                    { 
                      color: isActive ? '#fff' : isDark ? '#fff' : primaryBlue,
                      fontWeight: isActive ? '600' : '500',
                      marginLeft: 0, // No icon, so no margin needed
                    }
                  ]}
                >
                  {preset.miles} mi
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  typeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8, // Reduced to make room for hint text
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    marginHorizontal: 2,
    flexGrow: 1,
    justifyContent: 'center',
  },
  filterSortRow: {
    marginBottom: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 6,
  },
  filterText: {
    marginLeft: 6,
    fontSize: 13,
  },
  sortLabel: {
    fontSize: 13,
    marginRight: 8,
    marginLeft: 4,
  },
  radiusLabel: {
    fontSize: 13,
    marginRight: 8,
    marginLeft: 4,
  },
  radiusButton: {
    paddingHorizontal: 12,
    marginRight: 6,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default LocationFilters; 