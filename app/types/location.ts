// Define the type for a nearby location
export interface NearbyLocation {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  type: 'bar';
  isOpenNow?: boolean;
  opensSoon?: boolean;
  closesSoon?: boolean;
  rating?: number;
  distance?: number;
  details: LocationDetails | null;
}

// Define the type for location details
export interface LocationDetails {
  name: string;
  address: string;
  phoneNumber?: string;
  openingHours?: string[];
  rating?: number;
  priceLevel?: number;
  website?: string;
  photos?: {
    reference: string;
    width: number;
    height: number;
  }[];
}

// Define the type for location filters
export interface LocationFilters {
  openNow: boolean;
}

// Define the type for the selected location
export interface SelectedLocation {
  location: NearbyLocation;
  visible: boolean;
} 