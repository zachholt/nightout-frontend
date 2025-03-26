import '@testing-library/jest-native/extend-expect';

// Mock ExpoModulesCore
jest.mock('expo-modules-core', () => {
  return {
    ...jest.requireActual('expo-modules-core'),
    NativeModulesProxy: new Proxy(
      {},
      {
        get() {
          return () => {};
        },
      }
    ),
  };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
); 