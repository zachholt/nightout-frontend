import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationFilters as LocationFiltersType } from '../../types/location';

interface LocationFiltersProps {
  filters: LocationFiltersType;
  onFiltersChange: (filters: LocationFiltersType) => void;
  sortBy: 'distance' | 'rating' | null;
  onSortChange: (sortBy: 'distance' | 'rating' | null) => void;
}

const LocationFilters: React.FC<LocationFiltersProps> = ({
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const primaryBlue = '#2196F3';
  const lightBlue = '#E3F2FD';
  const darkBlue = '#1976D2';
  
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
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1c1c1e' : '#fff' }
    ]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        <Text style={[styles.sortLabel, { color: isDark ? '#999' : '#666' }]}>Sort:</Text>
        
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
              marginRight: 0,
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
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    marginVertical: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterText: {
    fontSize: 14,
    marginLeft: 6,
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 12,
    fontWeight: '500',
  },
});

export default LocationFilters; 