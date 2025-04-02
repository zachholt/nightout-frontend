import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  useColorScheme,
  Animated,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { NearbyLocation } from "../../types/location";
import { useRoute } from "../../context/RouteContext";
import { useUser } from "../../context/UserContext";
import { useFavorite } from "../../context/FavoriteContext";
import { useLocation } from "../../context/LocationContext";
import {
  getLocationIcon,
  getLocationTypeName,
} from "../../utils/locationUtils";

const staticProfileImages = [
  require("../../../assets/images/profile1.PNG"),
  require("../../../assets/images/profile2.PNG"),
  require("../../../assets/images/profile3.PNG"),
  require("../../../assets/images/profile4.PNG"),
  require("../../../assets/images/profile5.PNG"),
  require("../../../assets/images/profile6.PNG"),
  require("../../../assets/images/profile7.PNG"),
  require("../../../assets/images/profile8.PNG")
];

interface LocationDetailsProps {
  location: NearbyLocation;
  onClose: () => void;
  visible: boolean;
  onRouteToggle?: () => void;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  onClose,
  visible,
  onRouteToggle,
}) => {
  console.log(`[LocationDetails] --- Render Start ---`);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { currentRoute } = useRoute();
  const { user, checkIn, checkOut, isCheckedInAt } = useUser();
  const {
    isFavorite,
    addFavorite,
    removeFavorite,
    error: favoriteError,
  } = useFavorite();
  const { usersByLocationId, isLoading, refreshUsersForLocation } =
    useLocation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<
    "checkIn" | "checkOut" | null
  >(null);

  // For smooth scrolling
  const scrollViewRef = useRef(null);

  const { height, width } = Dimensions.get("window");

  const isInRoute = currentRoute.some((item) => item.id === location.id);
  const isUserCheckedIn =
    user && location ? isCheckedInAt(location.location) : false;
  const isLocationFavorite = isFavorite(location.id);

  console.log(
    `[LocationDetails] User object from context:`,
    user ? { id: user.id, lat: user.latitude, lon: user.longitude } : null
  );
  console.log(
    `[LocationDetails] Calculated local isUserCheckedIn: ${isUserCheckedIn}`
  );
  console.log(
    `[LocationDetails] Current actionInProgress: ${actionInProgress}`
  );

  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return "Not available";
    return phone;
  };

  const getTodayHours = () => {
    if (!location.details?.openingHours) return "Hours not available";

    const today = new Date().getDay();
    const googleDay = today === 0 ? 6 : today - 1;

    const todayHoursString = location.details.openingHours.find((hourString) =>
      hourString.startsWith(getDayName(googleDay))
    );

    if (!todayHoursString) return "Closed today";

    const hours = todayHoursString.split(": ")[1];
    return hours || "Hours not available";
  };

  const getDayName = (day: number): string => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days[day];
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.location.latitude},${location.location.longitude}&destination_place_id=${location.id}`;
    Linking.openURL(url);
  };

  const handleCall = () => {
    if (location.details?.phoneNumber) {
      Linking.openURL(`tel:${location.details.phoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (location.details?.website) {
      Linking.openURL(location.details.website);
    }
  };

  // Handle check-in or check-out
  const handleCheckInOut = useCallback(async () => {
    console.log(
      `[LocationDetails] handleCheckInOut called. Initial local isUserCheckedIn: ${isUserCheckedIn}`
    );

    if (!user || !location) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to check in at this location."
      );
      return;
    }

    // Determine the action based on the current check-in status
    const action = isUserCheckedIn ? "checkOut" : "checkIn";
    console.log(
      `[LocationDetails] Determined action: ${action}. Setting actionInProgress.`
    );
    setActionInProgress(action); // Set local state immediately

    try {
      console.log(`[LocationDetails] Calling context function: ${action}`);
      if (action === "checkOut") {
        await checkOut();
      } else {
        await checkIn(location.location.latitude, location.location.longitude);
        // After successful check-in, immediately update our local state
        // to reflect that we expect to be checked in at this location
        console.log(
          `[LocationDetails] Check-in successful, button should update immediately`
        );
      }
      console.log(`[LocationDetails] Context function ${action} finished.`);

      // Refresh data after successful action
      console.log(
        `[LocationDetails] Triggering manual refresh for location ${location.id} after ${action}.`
      );
      refreshUsersForLocation(location.id, true).catch((err) => {
        console.error(
          `[LocationDetails] Error explicitly refreshing after ${action}:`,
          err
        );
        Alert.alert(
          "Refresh Error",
          "Could not refresh user list after check-in/out."
        );
      });
    } catch (err) {
      console.error(`[LocationDetails] Error during ${action}:`, err);
      Alert.alert("Error", `Failed to ${action}. Please try again.`);
      // Reset local state immediately on error
      setActionInProgress(null);
    }
  }, [
    user,
    isUserCheckedIn,
    checkIn,
    checkOut,
    location,
    refreshUsersForLocation,
    setActionInProgress,
  ]);

  // New useEffect to reset actionInProgress when user state updates
  useEffect(() => {
    // If we were in the middle of a check-in/out action,
    // and the user object has now potentially been updated by the context,
    // reset the local action state. This ensures the button reflects the new
    // calculated isUserCheckedIn state based on the updated user data.
    if (actionInProgress) {
      console.log(
        "[LocationDetails] useEffect detected user update while action was in progress. Resetting actionInProgress."
      );
      setActionInProgress(null);
    }
  }, [user]); // Dependency: ONLY the user object from context

  // New useEffect to explicitly sync with user check-in status
  useEffect(() => {
    // This synchronizes the component with the current user state
    // by recalculating isUserCheckedIn whenever the user object changes
    if (user) {
      console.log(
        "[LocationDetails] User object updated, recalculating check-in status"
      );
      // The isUserCheckedIn var will be recalculated on next render with updated user object
    }

    // Reset action state whenever user state changes,
    // which happens after successful check-in/out operations
    if (actionInProgress) {
      console.log(
        "[LocationDetails] Resetting actionInProgress based on user update"
      );
      setActionInProgress(null);
    }
  }, [user, location]);

  const openingHours = location.details?.openingHours;

  // Simplified status display to match LocationCard
  let statusText = "Unknown";
  let statusColor = "#888";

  if (location.isOpenNow !== undefined) {
    statusColor = location.isOpenNow ? "#4CD964" : "#FF3B30"; // Green for open, red for closed
    statusText = location.isOpenNow ? "Open" : "Closed";
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsScrolled(offsetY > 50);
      },
    }
  );

  // Reset scroll position when location changes
  useEffect(() => {
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollY.setValue(0);
      }, 100);
    }
  }, [location, visible]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to favorite locations.");
      return;
    }

    try {
      setIsFavoriting(true);
      if (isLocationFavorite) {
        await removeFavorite(location.id);
      } else {
        await addFavorite(location);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert(
        "Error",
        favoriteError || "Failed to update favorite status. Please try again."
      );
    } finally {
      setIsFavoriting(false);
    }
  };

  // Get users for *this specific* location from the context state
  const usersAtThisLocation = usersByLocationId[location.id] || [];

  // Use the context's loading state
  const displayLoading = isLoading;

  // Update the way we determine the button text to account for actionInProgress
  const checkInOutButtonText =
    actionInProgress === "checkIn"
      ? "Checking In..."
      : actionInProgress === "checkOut"
      ? "Checking Out..."
      : isUserCheckedIn
      ? "Check Out"
      : "Check In";

  // Similarly update the button color logic
  const checkInOutButtonColor = actionInProgress
    ? "#888" // Grey when loading
    : isUserCheckedIn
    ? "#FF9500" // Orange for check-out
    : "#4CD964"; // Green for check-in

  // Determine button icon
  const checkInOutButtonIcon =
    actionInProgress === "checkOut" ||
    (actionInProgress === null && isUserCheckedIn)
      ? "exit-outline"
      : "location";

  console.log(
    `[LocationDetails] --- Render End --- ButtonText: ${checkInOutButtonText}`
  );

  return (
    <>
      {/* Initial Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? "#333" : "#e0e0e0" },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: isDark ? "#333" : "#f0f0f0" },
          ]}
          onPress={onClose}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#000" }]}>
          {location.name}
        </Text>

        <View style={styles.headerButtonsContainer}>
          {/* Favorite Button */}
          {user && (
            <TouchableOpacity
              style={[
                styles.headerActionButton,
                {
                  backgroundColor: isDark ? "#333" : "#f0f0f0",
                  marginRight: 8,
                  opacity: isFavoriting ? 0.5 : 1,
                },
              ]}
              onPress={handleFavoriteToggle}
              disabled={isFavoriting}
            >
              {isFavoriting ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#fff" : "#000"}
                />
              ) : (
                <Ionicons
                  name={isLocationFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={
                    isLocationFavorite ? "#FF3B30" : isDark ? "#fff" : "#000"
                  }
                />
              )}
            </TouchableOpacity>
          )}

          {/* Check-in/Check-out Button in Header */}
          {user && (
            <TouchableOpacity
              style={[
                styles.headerActionButton,
                { backgroundColor: checkInOutButtonColor },
              ]}
              onPress={handleCheckInOut}
              disabled={!!actionInProgress}
            >
              <Ionicons name={checkInOutButtonIcon} size={18} color="#fff" />
              <Text style={styles.headerActionButtonText}>
                {checkInOutButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content with BottomSheetScrollView */}
      <BottomSheetScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Main Info Section */}
        <View style={styles.mainInfoSection}>
          {/* Category */}
          <View style={styles.categoryContainer}>
            <Ionicons
              name={getLocationIcon(location.type)}
              size={18}
              color={isDark ? "#ddd" : "#666"}
            />
            <Text
              style={[styles.categoryText, { color: isDark ? "#ddd" : "#666" }]}
            >
              {getLocationTypeName(location.type)}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusIndicator, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>

          {/* Today's Hours */}
          <Text style={[styles.hoursText, { color: isDark ? "#ddd" : "#666" }]}>
            Today: {getTodayHours()}
          </Text>

          {/* Address */}
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={isDark ? "#ddd" : "#666"}
            />
            <Text
              style={[styles.infoText, { color: isDark ? "#ddd" : "#666" }]}
            >
              {location.address}
            </Text>
          </View>

          {/* Distance */}
          {location.distance !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={isDark ? "#ddd" : "#666"}
              />
              <Text
                style={[styles.infoText, { color: isDark ? "#ddd" : "#666" }]}
              >
                {location.distance.toFixed(1)} miles away
              </Text>
            </View>
          )}

          {/* Rating */}
          {location.details?.rating && (
            <View style={styles.infoRow}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text
                style={[styles.infoText, { color: isDark ? "#ddd" : "#666" }]}
              >
                {location.details.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Price Level */}
          {location.details?.priceLevel && (
            <View style={styles.infoRow}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={isDark ? "#ddd" : "#666"}
              />
              <Text
                style={[styles.infoText, { color: isDark ? "#ddd" : "#666" }]}
              >
                {Array(location.details.priceLevel).fill("$").join("")}
              </Text>
            </View>
          )}

          {/* Add to Route Button */}
          {onRouteToggle && (
            <View style={styles.routeButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.routeButton,
                  {
                    backgroundColor: isInRoute ? "#F44336" : "#2196F3",
                  },
                ]}
                onPress={onRouteToggle}
              >
                <Ionicons
                  name={isInRoute ? "remove-circle" : "add-circle"}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.routeButtonText}>
                  {isInRoute ? "Remove from Route" : "Add to Route"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Users at Location Section */}
          <View style={styles.sectionHeader}>
            <Ionicons
              name="people-outline"
              size={22}
              color={isDark ? "#ddd" : "#666"}
            />
            <Text
              style={[styles.sectionTitle, { color: isDark ? "#ddd" : "#666" }]}
            >
              People Here Now
            </Text>
          </View>

          {/* Use the new loading state and user list */}
          {displayLoading ? (
            <ActivityIndicator
              style={styles.loadingIndicator}
              color={isDark ? "#ddd" : "#666"}
            />
          ) : usersAtThisLocation.length > 0 ? (
            <View style={styles.usersContainer}>
              {usersAtThisLocation.map((userAtLocation, index) => {
                // Use modulo to cycle through our static images
                const imageIndex = index % staticProfileImages.length;
                return (
                  <View key={userAtLocation.id} style={styles.userCard}>
                    <View style={styles.userAvatarContainer}>
                      <Image
                        source={staticProfileImages[imageIndex]}
                        style={styles.userAvatar}
                      />
                    </View>
                    <Text
                      style={[
                        styles.userName,
                        { color: isDark ? "#fff" : "#000" },
                      ]}
                      numberOfLines={1}
                    >
                      {userAtLocation.name.split(" ")[0]}
                    </Text>
                    {user?.id !== undefined &&
                      String(userAtLocation.id) === String(user.id) && (
                        <View style={styles.currentUserBadge}>
                          <Text style={styles.currentUserText}>You</Text>
                        </View>
                      )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text
              style={[styles.noUsersText, { color: isDark ? "#aaa" : "#888" }]}
            >
              No one is checked in here right now
            </Text>
          )}
        </View>
      </BottomSheetScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  headerButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto", // Push buttons to the right
  },
  headerActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerActionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  scrollViewContent: {
    paddingBottom: 180, // Increased padding to prevent cut-off
    paddingHorizontal: 16,
  },
  mainInfoSection: {
    padding: 0, // Removing padding as it's now on scrollViewContent
  },
  locationName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontWeight: "500",
  },
  hoursText: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
  },
  routeButtonContainer: {
    marginVertical: 24,
    alignItems: "center",
  },
  routeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  routeButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  usersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  userCard: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
    marginHorizontal: "1.5%",
  },
  userAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 8,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
  },
  userAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  userName: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: "100%",
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noUsersText: {
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 20,
  },
  currentUserBadge: {
    backgroundColor: "#4CD964",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  currentUserText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default LocationDetails;
