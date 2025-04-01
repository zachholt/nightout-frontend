import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { User, useUser } from './UserContext';
import { NearbyLocation } from '../types/location';
import { AppState } from 'react-native';

// --- Interfaces ---
interface UsersByLocationId {
  [locationId: string]: User[];
}

interface TimestampsByLocationId {
  [locationId: string]: number;
}

interface LocationContextType {
  managedLocations: NearbyLocation[];
  usersByLocationId: UsersByLocationId;
  isLoading: boolean;
  error: string | null;
  setManagedLocations: (locations: NearbyLocation[]) => void;
  refreshUsersForLocation: (locationId: string, force?: boolean) => Promise<void>;
  refreshAllManagedUsers: (force?: boolean) => Promise<void>;
}

// --- Constants ---
const LocationContext = createContext<LocationContextType | undefined>(undefined);
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const POLLING_INTERVAL = 30 * 1000; // 30 seconds

// --- Provider Component ---
export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [managedLocations, setManagedLocationsState] = useState<NearbyLocation[]>([]);
  const [usersByLocationId, setUsersByLocationId] = useState<UsersByLocationId>({});
  const [timestampsByLocationId, setTimestampsByLocationId] = useState<TimestampsByLocationId>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, getUsersAtLocation } = useUser(); // Dependency from UserContext

  // Ref to track if a refresh is already in progress to prevent overlapping calls
  const isRefreshingRef = useRef(false);

  // --- Cache Logic ---
  const isCacheValid = useCallback((locationId: string): boolean => {
    const timestamp = timestampsByLocationId[locationId];
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
  }, [timestampsByLocationId]);

  // --- Core Fetching Logic ---
  const fetchUsersForSingleLocation = useCallback(async (
    location: NearbyLocation,
    force: boolean = false
  ): Promise<void> => {
    if (!user) return; // Need logged-in user
    if (!force && isCacheValid(location.id)) {
      //console.log(`[LocationContext] Cache valid for ${location.id}`);
      return; // Use cached data
    }

    //console.log(`[LocationContext] Fetching users for ${location.id}. Forced: ${force}`);
    try {
      const users = await getUsersAtLocation(
        location.location.latitude,
        location.location.longitude,
        100 // Radius
      );
      
      // Atomic update for users and timestamp of this specific location
      setUsersByLocationId(prev => ({
        ...prev,
        [location.id]: users,
      }));
      setTimestampsByLocationId(prev => ({
        ...prev,
        [location.id]: Date.now(),
      }));

    } catch (err) {
      console.error(`[LocationContext] Error fetching users for ${location.id}:`, err);
      setError(`Failed to fetch users for ${location.name}`);
      // Clear data for this location on error?
      setUsersByLocationId(prev => ({
        ...prev,
        [location.id]: [], // Set empty array on error
      }));
      // Don't update timestamp on error
    }
  }, [user, getUsersAtLocation, isCacheValid, setUsersByLocationId, setTimestampsByLocationId, setError]);

  // --- Exposed Refresh Functions ---
  const refreshUsersForLocation = useCallback(async (locationId: string, force: boolean = false) => {
    const location = managedLocations.find(loc => loc.id === locationId);
    if (location) {
      await fetchUsersForSingleLocation(location, force);
    }
  }, [managedLocations, fetchUsersForSingleLocation]);

  const refreshAllManagedUsers = useCallback(async (force: boolean = false) => {
    if (!user || managedLocations.length === 0 || isRefreshingRef.current) {
      //console.log('[LocationContext] Skipping refreshAllManagedUsers', { hasUser: !!user, count: managedLocations.length, isRefreshing: isRefreshingRef.current });
      return; // Don't run if no user, no locations, or already refreshing
    }

    isRefreshingRef.current = true;
    setIsLoading(true);
    setError(null);
    //console.log(`[LocationContext] Starting refreshAllManagedUsers. Forced: ${force}`);

    try {
      // Fetch users for all managed locations concurrently (respecting cache unless forced)
      const promises = managedLocations.map(loc => fetchUsersForSingleLocation(loc, force));
      await Promise.all(promises);
      //console.log('[LocationContext] Finished refreshAllManagedUsers.');
    } catch (err) {
      // Error handled within fetchUsersForSingleLocation, but log general failure too
      console.error('[LocationContext] Error during refreshAllManagedUsers:', err);
      setError('Failed to refresh some location data');
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [user, managedLocations, fetchUsersForSingleLocation, setIsLoading, setError]);

  // --- Function to Update Managed Locations ---
  const setManagedLocations = useCallback((locations: NearbyLocation[]) => {
    //console.log(`[LocationContext] Setting managed locations: ${locations.length} locations.`);
    setManagedLocationsState(locations);
    // Trigger a refresh for the new set of locations (will respect cache)
    refreshAllManagedUsers(false);
  }, [refreshAllManagedUsers]);

  // --- Polling Effect ---
  useEffect(() => {
    //console.log('[LocationContext] Setting up polling interval.');
    const intervalId = setInterval(() => {
      //console.log('[LocationContext] Polling: Triggering refreshAllManagedUsers.');
      refreshAllManagedUsers(false); // Poll without forcing cache
    }, POLLING_INTERVAL);

    return () => {
      //console.log('[LocationContext] Clearing polling interval.');
      clearInterval(intervalId);
    };
  }, [refreshAllManagedUsers]); // Re-run if refresh function changes (it shouldn't often)

  // --- AppState Foreground Refresh Effect ---
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        //console.log('[LocationContext] App became active. Forcing refresh of all managed users.');
        // Force a refresh when app comes to foreground
        refreshAllManagedUsers(true);
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  }, [refreshAllManagedUsers]);

  // --- Context Value ---
  const contextValue = useMemo(() => ({
    managedLocations,
    usersByLocationId,
    isLoading,
    error,
    setManagedLocations,
    refreshUsersForLocation,
    refreshAllManagedUsers,
  }), [
    managedLocations,
    usersByLocationId,
    isLoading,
    error,
    setManagedLocations, // Include the setter
    refreshUsersForLocation, // Include the specific refresh
    refreshAllManagedUsers, // Include the general refresh
  ]);

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

// --- Hook ---
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}; 