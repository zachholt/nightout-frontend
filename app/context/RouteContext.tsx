import React, { createContext, useState, useContext, ReactNode } from 'react';

export type RouteLocation = {
  id: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  locationType: 'bar';
};

export type Route = {
  id: string;
  name: string;
  locations: RouteLocation[];
  createdAt: Date;
};

type RouteContextType = {
  currentRoute: RouteLocation[];
  savedRoutes: Route[];
  addToRoute: (location: RouteLocation) => void;
  removeFromRoute: (locationId: string) => void;
  clearRoute: () => void;
  saveRoute: (name: string) => void;
  deleteRoute: (routeId: string) => void;
  updateRoute: (newRoute: RouteLocation[]) => void;
};

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<RouteLocation[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<Route[]>([]);

  const addToRoute = (location: RouteLocation) => {
    if (!currentRoute.some(item => item.id === location.id)) {
      setCurrentRoute(prev => [...prev, location]);
    }
  };

  const removeFromRoute = (locationId: string) => {
    setCurrentRoute(prev => prev.filter(location => location.id !== locationId));
  };

  const clearRoute = () => {
    setCurrentRoute([]);
  };

  const saveRoute = (name: string) => {
    if (currentRoute.length > 0) {
      const newRoute: Route = {
        id: `route-${Date.now()}`,
        name,
        locations: [...currentRoute],
        createdAt: new Date(),
      };
      setSavedRoutes(prev => [...prev, newRoute]);
    }
  };

  const deleteRoute = (routeId: string) => {
    setSavedRoutes(prev => prev.filter(route => route.id !== routeId));
  };

  const updateRoute = (newRoute: RouteLocation[]) => {
    setCurrentRoute(newRoute);
  };

  return (
    <RouteContext.Provider
      value={{
        currentRoute,
        savedRoutes,
        addToRoute,
        removeFromRoute,
        clearRoute,
        saveRoute,
        deleteRoute,
        updateRoute,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}; 