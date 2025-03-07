// Helper functions to calculate distance using the Haversine formula
export const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const getDistanceInMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMiles = distanceKm * 0.621371;
  return distanceMiles;
};

// Helper function to check if a location opens or closes soon (within 30 minutes)
export const getOpenStatus = (openingHours?: string[]) => {
  if (!openingHours) {
    console.log('No opening hours provided');
    return { isOpen: undefined, opensSoon: false, closesSoon: false };
  }
  
  const now = new Date();
  console.log('Current time:', now.toLocaleTimeString());
  
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  // Convert to Google's format (0 = Monday, 6 = Sunday)
  const googleDay = currentDay === 0 ? 6 : currentDay - 1;
  console.log('Current day (Google format):', googleDay);
  
  // Get today's hours
  const todayHours = openingHours[googleDay];
  console.log('Today\'s hours:', todayHours);
  
  if (!todayHours) {
    console.log('No hours for today');
    return { isOpen: undefined, opensSoon: false, closesSoon: false };
  }
  
  // Parse hours from format like "Monday: 9:00 AM – 10:00 PM"
  const hoursText = todayHours.split(': ')[1];
  console.log('Hours text:', hoursText);
  
  if (!hoursText || hoursText.toLowerCase().includes('closed')) {
    console.log('Location is closed today');
    return { isOpen: false, opensSoon: false, closesSoon: false };
  }
  
  // Handle multiple time ranges (e.g., "9:00 AM – 2:00 PM, 5:00 PM – 10:00 PM")
  const timeRanges = hoursText.split(', ');
  console.log('Time ranges:', timeRanges);
  
  // Check each time range
  for (const timeRange of timeRanges) {
    const [openTime, closeTime] = timeRange.split(' – ');
    if (!openTime || !closeTime) {
      console.log('Invalid time range:', timeRange);
      continue;
    }
    
    console.log('Checking range:', openTime, 'to', closeTime);
    
    // Parse times to Date objects
    const openDate = parseTimeString(openTime, now);
    const closeDate = parseTimeString(closeTime, now);
    
    console.log('Open date:', openDate.toLocaleTimeString());
    console.log('Close date:', closeDate.toLocaleTimeString());
    
    // If close time is earlier than open time, it means it closes after midnight
    if (closeDate < openDate) {
      closeDate.setDate(closeDate.getDate() + 1);
      console.log('Adjusted close date (after midnight):', closeDate.toLocaleTimeString());
    }
    
    // Current time
    const currentTime = now.getTime();
    
    // Calculate time differences in minutes
    const minutesToOpen = Math.round((openDate.getTime() - currentTime) / (1000 * 60));
    const minutesToClose = Math.round((closeDate.getTime() - currentTime) / (1000 * 60));
    
    console.log('Minutes to open:', minutesToOpen);
    console.log('Minutes to close:', minutesToClose);
    
    // Check if currently open
    const isOpen = currentTime >= openDate.getTime() && currentTime < closeDate.getTime();
    console.log('Is open:', isOpen);
    
    // Check if opens or closes soon (within 30 minutes)
    const opensSoon = !isOpen && minutesToOpen > 0 && minutesToOpen <= 30;
    const closesSoon = isOpen && minutesToClose > 0 && minutesToClose <= 30;
    
    console.log('Opens soon:', opensSoon);
    console.log('Closes soon:', closesSoon);
    
    if (isOpen || opensSoon) {
      console.log('Returning status: open or opens soon');
      return { isOpen, opensSoon, closesSoon, minutesToOpen, minutesToClose };
    }
  }
  
  // If we get here, the place is closed and not opening soon
  console.log('Location is closed and not opening soon');
  return { isOpen: false, opensSoon: false, closesSoon: false };
};

// Helper function to parse time strings like "9:00 AM" to Date objects
export const parseTimeString = (timeStr: string, baseDate: Date) => {
  console.log('Parsing time string:', timeStr);
  
  const result = new Date(baseDate);
  
  // Reset hours, minutes, seconds
  result.setHours(0, 0, 0, 0);
  
  try {
    // Parse the time string
    const [time, period] = timeStr.split(' ');
    console.log('Time parts:', time, period);
    
    if (!time || !period) {
      console.error('Invalid time format:', timeStr);
      return result; // Return midnight as fallback
    }
    
    let [hours, minutes] = time.split(':').map(Number);
    console.log('Hours:', hours, 'Minutes:', minutes);
    
    // Handle invalid values
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Invalid hours or minutes:', hours, minutes);
      return result; // Return midnight as fallback
    }
    
    // Adjust for PM
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
      console.log('Adjusted for PM:', hours);
    }
    // Adjust for 12 AM
    if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
      console.log('Adjusted for 12 AM:', hours);
    }
    
    result.setHours(hours, minutes);
    console.log('Parsed time result:', result.toLocaleTimeString());
  } catch (error) {
    console.error('Error parsing time string:', timeStr, error);
  }
  
  return result;
};

// Get the appropriate icon for the location type
export const getLocationIcon = (locationType: string): any => {
  switch (locationType) {
    case 'bar':
      return 'beer-outline';
    case 'restaurant':
      return 'restaurant-outline';
    case 'cafe':
      return 'cafe-outline';
    case 'night_club':
      return 'musical-notes-outline';
    case 'movie_theater':
      return 'film-outline';
    case 'bowling_alley':
      return 'basketball-outline';
    default:
      return 'business-outline';
  }
};

// Get a human-readable name for the location type
export const getLocationTypeName = (locationType: string): string => {
  switch (locationType) {
    case 'bar':
      return 'Bar';
    case 'restaurant':
      return 'Restaurant';
    case 'cafe':
      return 'Café';
    case 'night_club':
      return 'Night Club';
    case 'movie_theater':
      return 'Movie Theater';
    case 'bowling_alley':
      return 'Bowling Alley';
    default:
      return locationType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}; 