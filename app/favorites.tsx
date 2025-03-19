import React from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFavorite } from './context/FavoriteContext';
import { LocationCard } from './components/Locations/LocationCard';
import { getLocationIcon } from './utils/locationUtils';
import { useUser } from './context/UserContext';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { favorites } = useFavorite();
  const { user } = useUser();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Favorite Places',
          headerStyle: {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
          headerBackTitle: 'Profile',
          presentation: 'card',
        }}
      />
      <View style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#F2F2F7' }
      ]}>
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[
              styles.emptyText,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}>
              You haven't favorited any places yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {favorites.map(location => (
              <LocationCard
                key={location.id}
                location={location}
                name={location.name}
                type={location.type}
                distance={location.distance}
                address={location.address}
                iconName={getLocationIcon(location.type)}
                isOpenNow={location.isOpenNow}
                rating={location.rating}
                isAuthenticated={!!user}
                onPress={() => {
                  // Navigate back to the map and show this location's details
                  router.push({
                    pathname: '/(tabs)',
                    params: { selectedLocationId: location.id }
                  });
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 