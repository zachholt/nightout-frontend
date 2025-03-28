import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './UserContext';
import { useUser } from './UserContext';
import { AppState } from 'react-native';

// Interface for tracking user counts at locations
interface LocationUserCounts {
  [locationId: string]: number;
}

// Interface for users at locations
interface LocationUsers {
  [locationId: string]: User[];
}

// Interface for cache entries
interface CacheEntry {
  data: User[];
  timestamp: number;
}

interface LocationCache {
  [locationId: string]: CacheEntry;
}

interface LocationContextType {
  userCounts: LocationUserCounts;
  usersAtLocations: LocationUsers;
  isLoadingCounts: boolean;
  error: string | null;
  refreshLocationData: (locationIds: string[], coordinates: { latitude: number; longitude: number }[]) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const FETCH_THROTTLE = 30 * 1000; // 30 seconds in milliseconds

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userCounts, setUserCounts] = useState<LocationUserCounts>({});
  const [usersAtLocations, setUsersAtLocations] = useState<LocationUsers>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationCache, setLocationCache] = useState<LocationCache>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { user, getUsersAtLocation } = useUser();

  const isCacheValid = (locationId: string): boolean => {
    const cache = locationCache[locationId];
    if (!cache) return false;
    
    const now = Date.now();
    return now - cache.timestamp < CACHE_DURATION;
  };

  const canFetch = (): boolean => {
    const now = Date.now();
    return now - lastFetchTime >= FETCH_THROTTLE;
  };

  const refreshLocationData = async (
    locationIds: string[],
    coordinates: { latitude: number; longitude: number }[]
  ) => {
    if (!user || locationIds.length === 0) return;
    
    // Check if we should fetch based on throttle
    if (!canFetch()) {
      console.log('Skipping fetch due to throttle');
      return;
    }

    setIsLoadingCounts(true);
    setError(null);
    setLastFetchTime(Date.now());

    try {
      const newCounts: LocationUserCounts = {};
      const newUsers: LocationUsers = {};
      const newCache: LocationCache = { ...locationCache };

      // Process locations in batches to avoid too many simultaneous requests
      const batchSize = 5;
      for (let i = 0; i < locationIds.length; i += batchSize) {
        const batchIds = locationIds.slice(i, i + batchSize);
        const batchCoords = coordinates.slice(i, i + batchSize);

        // Create an array of promises for each location in the batch
        const promises = batchIds.map(async (locationId, index) => {
          // Check cache first
          if (isCacheValid(locationId)) {
            const cachedData = locationCache[locationId].data;
            newCounts[locationId] = cachedData.length;
            newUsers[locationId] = cachedData;
            return;
          }

          try {
            const users = await getUsersAtLocation(
              batchCoords[index].latitude,
              batchCoords[index].longitude,
              100 // Radius in meters
            );

            // Update cache
            newCache[locationId] = {
              data: users,
              timestamp: Date.now()
            };

            newCounts[locationId] = users.length;
            newUsers[locationId] = users;
          } catch (error) {
            console.error(`Error fetching users for location ${locationId}:`, error);
            newCounts[locationId] = 0;
            newUsers[locationId] = [];
          }
        });

        // Wait for all promises in this batch to resolve
        await Promise.all(promises);
      }

      setLocationCache(newCache);
      setUserCounts(newCounts);
      setUsersAtLocations(newUsers);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to fetch location data');
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Set up an AppState listener to refresh when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Clear the cache when app comes to foreground
        setLocationCache({});
        setLastFetchTime(0); // Reset throttle
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userCounts,
        usersAtLocations,
        isLoadingCounts,
        error,
        refreshLocationData,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}; 