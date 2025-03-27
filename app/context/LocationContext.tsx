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

interface LocationContextType {
  userCounts: LocationUserCounts;
  usersAtLocations: LocationUsers;
  isLoadingCounts: boolean;
  error: string | null;
  refreshLocationData: (locationIds: string[], coordinates: { latitude: number; longitude: number }[]) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userCounts, setUserCounts] = useState<LocationUserCounts>({});
  const [usersAtLocations, setUsersAtLocations] = useState<LocationUsers>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, getUsersAtLocation } = useUser();

  const refreshLocationData = async (
    locationIds: string[],
    coordinates: { latitude: number; longitude: number }[]
  ) => {
    if (!user || locationIds.length === 0) return;

    setIsLoadingCounts(true);
    setError(null);

    try {
      const newCounts: LocationUserCounts = {};
      const newUsers: LocationUsers = {};

      // Process locations in batches to avoid too many simultaneous requests
      const batchSize = 5;
      for (let i = 0; i < locationIds.length; i += batchSize) {
        const batchIds = locationIds.slice(i, i + batchSize);
        const batchCoords = coordinates.slice(i, i + batchSize);

        // Create an array of promises for each location in the batch
        const promises = batchIds.map(async (locationId, index) => {
          try {
            const users = await getUsersAtLocation(
              batchCoords[index].latitude,
              batchCoords[index].longitude,
              100 // Radius in meters to get users at this specific location
            );

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
        console.log('App has come to the foreground - refreshing location data');
        // We'll need to pass the current locations when implementing this refresh
        // This will be handled by the components using this context
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