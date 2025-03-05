import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  useColorScheme,
  Animated,
  Platform,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '../../types/location';
import { useRoute, RouteLocation } from '../../context/RouteContext';

interface LocationDetailsProps {
  location: NearbyLocation;
  onClose: () => void;
  visible: boolean;
  onRouteToggle?: () => void;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ location, onClose, visible, onRouteToggle }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentRoute } = useRoute();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { height, width } = Dimensions.get('window');
  
  const isInRoute = currentRoute.some(item => item.id === location.id);
  
  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Not available';
    return phone;
  };
  
  const getTodayHours = () => {
    if (!location.details?.openingHours) return 'Hours not available';
    
    const today = new Date().getDay();
    const googleDay = today === 0 ? 6 : today - 1;
    
    const todayHoursString = location.details.openingHours.find(
      hourString => hourString.startsWith(getDayName(googleDay))
    );
    
    if (!todayHoursString) return 'Closed today';
    
    const hours = todayHoursString.split(': ')[1];
    return hours || 'Hours not available';
  };
  
  const getDayName = (day: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day];
  };
  
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}&destination_place_id=${location.id}`;
    Linking.openURL(url);
  };
  
  const handleCall = () => {
    if (location.details?.phoneNumber) {
      Linking.openURL(`tel:${location.details.phoneNumber}`);
    }
  };
  
  const handleWebsite = () => {
    if (location.details?.website) {
      Linking.openURL(location.details.website);
    }
  };
  
  const openingHours = location.details?.openingHours;
  
  // Simplified status display to match LocationCard
  let statusText = 'Unknown';
  let statusColor = '#888';
  
  if (location.isOpenNow !== undefined) {
    statusColor = location.isOpenNow ? '#4CD964' : '#FF3B30'; // Green for open, red for closed
    statusText = location.isOpenNow ? 'Open' : 'Closed';
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsScrolled(offsetY > 50);
      }
    }
  );
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });
  
  return (
    <>
      {/* Initial Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
          onPress={onClose}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
          {location.name}
        </Text>
        
        {/* Add to Route Button in header */}
        {onRouteToggle && (
          <TouchableOpacity
            style={[
              styles.headerRouteButton,
              {
                backgroundColor: isInRoute ? '#F44336' : '#2196F3',
              },
            ]}
            onPress={onRouteToggle}
          >
            <Ionicons
              name={isInRoute ? 'trash-outline' : 'add-circle-outline'}
              size={18}
              color="#fff"
            />
            <Text style={styles.headerRouteButtonText}>
              {isInRoute ? 'Remove' : 'Add to Route'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Main Content with BottomSheetScrollView */}
      <BottomSheetScrollView 
        onScroll={handleScroll}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Main Info Section */}
        <View style={styles.mainInfoSection}>
          {/* Category */}
          <View style={styles.categoryContainer}>
            <Ionicons name="beer-outline" size={18} color={isDark ? '#ddd' : '#666'} />
            <Text style={[styles.categoryText, { color: isDark ? '#ddd' : '#666' }]}>
              Bar
            </Text>
          </View>
          
          {/* Status */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: statusColor },
              ]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
          
          {/* Today's Hours */}
          <Text style={[styles.hoursText, { color: isDark ? '#ddd' : '#666' }]}>
            Today: {getTodayHours()}
          </Text>
          
          {/* Address */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={isDark ? '#ddd' : '#666'} />
            <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#666' }]}>
              {location.address}
            </Text>
          </View>
          
          {/* Distance */}
          {location.distance !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name="navigate-outline" size={20} color={isDark ? '#ddd' : '#666'} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#666' }]}>
                {location.distance.toFixed(1)} miles away
              </Text>
            </View>
          )}
          
          {/* Rating */}
          {location.details?.rating && (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#666' }]}>
                {location.details.rating.toFixed(1)}
              </Text>
            </View>
          )}
          
          {/* Price Level */}
          {location.details?.priceLevel && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={isDark ? '#ddd' : '#666'} />
              <Text style={[styles.infoText, { color: isDark ? '#ddd' : '#666' }]}>
                {Array(location.details.priceLevel).fill('$').join('')}
              </Text>
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  headerRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  headerRouteButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    zIndex: 2,
  },
  stickyHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollViewContent: {
    paddingBottom: 150,
  },
  mainInfoSection: {
    padding: 16,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '500',
  },
  hoursText: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  hoursItem: {
    marginBottom: 8,
    fontSize: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonText: {
    marginTop: 4,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 80,
  },
});

export default LocationDetails;

 