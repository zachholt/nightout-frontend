import React, { useRef, useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '../../types/location';
import { useRoute } from '../../context/RouteContext';
import { useUser } from '../../context/UserContext';
import { useFavorite } from '../../context/FavoriteContext';
import { useLocation } from '../../context/LocationContext';
import { getLocationIcon, getLocationTypeName } from '../../utils/locationUtils';

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
  const { user, checkIn, checkOut, isCheckedInAt, isCheckingIn } = useUser();
  const { isFavorite, addFavorite, removeFavorite, error: favoriteError } = useFavorite();
  const { usersAtLocations, isLoadingCounts, refreshLocationData } = useLocation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const REFRESH_INTERVAL = 10000; // 10 seconds
  
  // For smooth scrolling
  const scrollViewRef = useRef(null);
  
  const { height, width } = Dimensions.get('window');
  
  const isInRoute = currentRoute.some(item => item.id === location.id);
  const isUserCheckedIn = user && isCheckedInAt(location.location);
  const isLocationFavorite = isFavorite(location.id);

  // Fetch users at this location using LocationContext
  useEffect(() => {
    if (!visible || !location) return;

    const currentTime = Date.now();
    if (currentTime - lastRefreshTime < REFRESH_INTERVAL) {
      return; // Skip refresh if not enough time has passed
    }

    const fetchData = async () => {
      await refreshLocationData([location.id], [{
        latitude: location.location.latitude,
        longitude: location.location.longitude
      }]);
      setLastRefreshTime(currentTime);
    };

    fetchData();

    // Set up periodic refresh
    const refreshInterval = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [visible, location, refreshLocationData]);
  
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

  // Handle check-in or check-out
  const handleCheckInOut = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to check in at this location.');
      return;
    }

    try {
      if (isUserCheckedIn) {
        // Check out
        await checkOut();
        Alert.alert('Success', 'You have checked out from this location!');
      } else {
        // Check in
        await checkIn(
          location.location.latitude,
          location.location.longitude
        );
        Alert.alert('Success', 'You have checked in at this location!');
      }
    } catch (err) {
      const action = isUserCheckedIn ? 'check out' : 'check in';
      Alert.alert('Error', `Failed to ${action}. Please try again.`);
      console.error(`${action} error:`, err);
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
  
  // Reset scroll position when location changes
  useEffect(() => {
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollY.setValue(0);
      }, 100);
    }
  }, [location, visible]);
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });
  
  const handleFavoriteToggle = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to favorite locations.');
      return;
    }

    try {
      setIsFavoriting(true);
      if (isLocationFavorite) {
        await removeFavorite(location.id);
      } else {
        await addFavorite(location);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', favoriteError || 'Failed to update favorite status. Please try again.');
    } finally {
      setIsFavoriting(false);
    }
  };

  // Get users at this location from the LocationContext
  const usersAtLocation = usersAtLocations[location.id] || [];
  
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
        
        <View style={styles.headerButtonsContainer}>
          {/* Favorite Button */}
          {user && (
            <TouchableOpacity
              style={[
                styles.headerActionButton,
                { 
                  backgroundColor: isDark ? '#333' : '#f0f0f0',
                  marginRight: 8,
                  opacity: isFavoriting ? 0.5 : 1,
                }
              ]}
              onPress={handleFavoriteToggle}
              disabled={isFavoriting}
            >
              {isFavoriting ? (
                <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
              ) : (
                <Ionicons
                  name={isLocationFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={isLocationFavorite ? '#FF3B30' : (isDark ? '#fff' : '#000')}
                />
              )}
            </TouchableOpacity>
          )}
          
          {/* Check-in/Check-out Button in Header */}
          {user && (
            <TouchableOpacity
              style={[
                styles.headerActionButton,
                { 
                  backgroundColor: isCheckingIn 
                    ? '#888' 
                    : isUserCheckedIn 
                      ? '#FF9500' // Orange for check-out
                      : '#4CD964'  // Green for check-in
                }
              ]}
              onPress={handleCheckInOut}
              disabled={isCheckingIn}
            >
              <Ionicons
                name={isUserCheckedIn ? "exit-outline" : "location"}
                size={18}
                color="#fff"
              />
              <Text style={styles.headerActionButtonText}>
                {isCheckingIn 
                  ? (isUserCheckedIn ? 'Checking Out...' : 'Checking In...') 
                  : (isUserCheckedIn ? 'Check Out' : 'Check In')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Main Content with BottomSheetScrollView */}
      <BottomSheetScrollView 
        ref={scrollViewRef}
        onScroll={handleScroll}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Main Info Section */}
        <View style={styles.mainInfoSection}>
          {/* Category */}
          <View style={styles.categoryContainer}>
            <Ionicons 
              name={getLocationIcon(location.type)} 
              size={18} 
              color={isDark ? '#ddd' : '#666'} 
            />
            <Text style={[styles.categoryText, { color: isDark ? '#ddd' : '#666' }]}>
              {getLocationTypeName(location.type)}
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
          
          {/* Add to Route Button */}
          {onRouteToggle && (
            <View style={styles.routeButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.routeButton,
                  {
                    backgroundColor: isInRoute ? '#F44336' : '#2196F3',
                  },
                ]}
                onPress={onRouteToggle}
              >
                <Ionicons
                  name={isInRoute ? 'remove-circle' : 'add-circle'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.routeButtonText}>
                  {isInRoute ? 'Remove from Route' : 'Add to Route'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Users at Location Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={22} color={isDark ? '#ddd' : '#666'} />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ddd' : '#666' }]}>
              People Here Now
            </Text>
          </View>
          
          {isLoadingCounts ? (
            <ActivityIndicator style={styles.loadingIndicator} color={isDark ? '#ddd' : '#666'} />
          ) : usersAtLocation.length > 0 ? (
            <View style={styles.usersContainer}>
              {usersAtLocation.map((userAtLocation) => (
                <View key={userAtLocation.id} style={styles.userCard}>
                  <View style={styles.userAvatarContainer}>
                    {userAtLocation.profileImage ? (
                      <Image 
                        source={{ uri: userAtLocation.profileImage }} 
                        style={styles.userAvatar} 
                      />
                    ) : (
                      <View style={[
                        styles.userAvatarPlaceholder, 
                        { backgroundColor: isDark ? '#444' : '#e0e0e0' }
                      ]}>
                        <Ionicons name="person" size={20} color={isDark ? '#ddd' : '#666'} />
                      </View>
                    )}
                  </View>
                  <Text 
                    style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}
                    numberOfLines={1}
                  >
                    {userAtLocation.name.split(' ')[0]}
                  </Text>
                  {user?.id !== undefined && String(userAtLocation.id) === String(user.id) && (
                    <View style={styles.currentUserBadge}>
                      <Text style={styles.currentUserText}>You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noUsersText, { color: isDark ? '#aaa' : '#888' }]}>
              No one is checked in here right now
            </Text>
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
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto', // Push buttons to the right
  },
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerActionButtonText: {
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
    paddingBottom: 180, // Increased padding to prevent cut-off
    paddingHorizontal: 16,
  },
  mainInfoSection: {
    padding: 0, // Removing padding as it's now on scrollViewContent
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '500',
  },
  hoursText: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
  },
  routeButtonContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  routeButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  usersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  userCard: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: '1.5%',
  },
  userAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  userAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: '100%',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noUsersText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  currentUserBadge: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  currentUserText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default LocationDetails;

 