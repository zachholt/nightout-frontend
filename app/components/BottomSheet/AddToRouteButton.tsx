import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { NearbyLocation } from '../../types/location';

interface AddToRouteButtonProps {
  location: NearbyLocation;
  isInRoute: boolean;
  onToggle: () => void;
  isDark: boolean;
  insets: EdgeInsets;
}

const AddToRouteButton: React.FC<AddToRouteButtonProps> = ({
  location,
  isInRoute,
  onToggle,
  isDark,
  insets,
}) => {
  return (
    <View style={[
      styles.bottomSheetButtonContainer,
      {
        paddingBottom: Math.max(insets.bottom, 16),
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderTopColor: isDark ? '#333' : '#e0e0e0'
      }
    ]}>
      <TouchableOpacity
        style={[
          styles.routeButton,
          {
            backgroundColor: isInRoute ? '#F44336' : '#2196F3',
          },
        ]}
        onPress={onToggle}
      >
        <Ionicons
          name={isInRoute ? 'trash-outline' : 'add-circle-outline'}
          size={24}
          color="#fff"
        />
        <Text style={styles.routeButtonText}>
          {isInRoute ? 'Remove from Route' : 'Add to Route'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheetButtonContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  routeButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default AddToRouteButton; 