// components/RadiusSlider.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

type RadiusSliderProps = {
  radius: number;
  onRadiusChange: (value: number) => void;
  isDark: boolean;
};

export const RadiusSlider = ({ radius, onRadiusChange, isDark }: RadiusSliderProps) => {
  return (
    <View style={styles.sliderContainer}>
      <Text style={[styles.sliderLabel, { color: isDark ? '#fff' : '#000' }]}>
        Search Radius: {radius}m (~{(radius * 0.000621371).toFixed(1)} miles)
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={100}
        maximumValue={25000}
        step={100}
        value={radius}
        onValueChange={onRadiusChange}
        minimumTrackTintColor={isDark ? '#4da6ff' : '#0066cc'}
        maximumTrackTintColor={isDark ? '#666' : '#999'}
        thumbTintColor={isDark ? '#4da6ff' : '#0066cc'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});