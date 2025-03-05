import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyLocation } from '@/app/types/location';
import { useCheckIn } from '../context/CheckInContext';

interface CheckInButtonProp {
  location: NearbyLocation;
  isDark: boolean;
}

const CheckInButton: React.FC<CheckInButtonProp> = ({ location, isDark }) => {
  const { state, dispatch } = useCheckIn();
  const isCheckedIn = state.checkIns.some(
    (checkIn) => checkIn.location.id === location.id
  );

  const handlePress = () => {
    if (isCheckedIn) {
      // If already checked in, remove the check-in
      dispatch({
        type: 'REMOVE_CHECK_IN',
        payload: { locationId: location.id },
      });
    } else {
      // If not checked in, add the check-in with the entire location object
      dispatch({
        type: 'ADD_CHECK_IN',
        payload: {
          id: `${location.id}-${Date.now()}`, // Unique ID for the check-in
          userId: 'user1', // Replace with actual user ID
          location: location, // Store the entire location object
          timestamp: Date.now(),
        },
      });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.checkInButton,
        {
          backgroundColor: isCheckedIn ? '#4CD964' : '#2196F3',
        },
      ]}
      onPress={handlePress}
    >
      <Ionicons
        name={isCheckedIn ? 'checkmark-circle' : 'checkmark-circle-outline'}
        size={16}
        color="#fff"
      />
      <Text style={styles.checkInButtonText}>
        {isCheckedIn ? 'Checked In' : 'Check In'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
    height: 44,
    width: 80,
  },
  checkInButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 12,
  },
});

export default CheckInButton;