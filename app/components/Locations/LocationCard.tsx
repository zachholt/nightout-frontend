import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '@/app/types/location';
import { useUser } from '@/app/context/UserContext';

export type LocationCardProps = {
  location: NearbyLocation;
  name: string;
  type: string;
  distance?: number;
  address: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isOpenNow?: boolean;
  rating?: number;
  isInRoute?: boolean;
  userCount?: number;
  isAuthenticated?: boolean;
  onPress: () => void;
  openingHours?: string[];
};

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  name,
  type,
  distance,
  address,
  iconName,
  isOpenNow,
  rating,
  isInRoute = false,
  userCount = 0,
  isAuthenticated = false,
  onPress,
  openingHours,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, isCheckedInAt } = useUser();
  
  const isUserCheckedIn = user && location ? isCheckedInAt(location.location) : false;
  
  const cardBackground = isDark ? '#2C2C2E' : '#F5F5F5';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#ADADAD' : '#666666';
  const accentColor = '#007AFF';
  
  const getTodayHours = () => {
    if (!openingHours || openingHours.length === 0) return null;
    
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const googleDay = today === 0 ? 6 : today - 1;
    
    const todayHoursString = openingHours[googleDay];
    
    if (todayHoursString) {
      const hoursText = todayHoursString.split(': ')[1];
      return hoursText;
    }
    return null;
  };
  
  const todayHours = getTodayHours();
  
  let statusColor = '#999999'; // Default gray
  let statusText = 'Hours unknown';
  
  if (isOpenNow !== undefined) {
    statusColor = isOpenNow ? '#4CD964' : '#FF3B30'; // Green for open, red for closed
    statusText = isOpenNow ? 'Open' : 'Closed';
  }
  
  const formattedDistance = distance !== undefined ? `${distance.toFixed(1)} mi` : 'Unknown';
  
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBackground }]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={24} color={accentColor} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.indicatorsContainer}>
            {isAuthenticated && (
              <View style={[
                styles.userCountPill,
                { 
                  backgroundColor: isUserCheckedIn 
                    ? '#4CD964' // Green when user is checked in here
                    : (userCount > 0 ? '#007AFF' : (isDark ? '#3A3A3C' : '#D1D1D6')) 
                }
              ]}>
                <Ionicons 
                  name={isUserCheckedIn ? "person-circle" : (userCount > 0 ? "people" : "people-outline")} 
                  size={14} 
                  color="#FFFFFF" 
                />
                <Text style={styles.userCountText}>
                  {isUserCheckedIn ? (userCount > 1 ? `You + ${userCount - 1}` : 'You') : userCount}
                </Text>
              </View>
            )}
            {isInRoute && (
              <View style={styles.routeIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#4CD964" />
                <Text style={styles.routeIndicatorText}>In Route</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.address, { color: subtextColor }]} numberOfLines={1}>
          {address}
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={14} color={subtextColor} />
            <Text style={[styles.detailText, { color: subtextColor }]}>{formattedDistance}</Text>
          </View>
          
          {isOpenNow !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons 
                name="ellipse" 
                size={8} 
                color={statusColor} 
              />
              <Text 
                style={[
                  styles.detailText, 
                  { 
                    color: statusColor,
                    fontWeight: '500'
                  }
                ]}
              >
                {statusText}
              </Text>
            </View>
          )}
          {rating !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons name="star" size={14} color="#FF9500" />
              <Text style={[styles.detailText, { color: subtextColor }]}>
                {rating.toFixed(1)}
              </Text>
            </View>
          )}
          
          {isUserCheckedIn && !isAuthenticated && (
            <View style={styles.checkedInBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.checkedInText}>You're Here</Text>
            </View>
          )}
        </View>
        
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  routeIndicatorText: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: '500',
    marginLeft: 2,
  },
  userCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  userCountText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  address: {
    fontSize: 14,
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CD964',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto', // Push to the right
  },
  checkedInText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 2,
  },
}); 

export default LocationCard