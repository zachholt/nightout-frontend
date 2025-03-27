import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, User } from '../../context/UserContext';
import { useFavorite } from '../../context/FavoriteContext';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { authApi } from '@/services/auth';
import { NearbyLocation } from '@/app/types/location';
import { fetchNearbyPlaces } from '@/app/utils/apiUtils';
import * as Location from 'expo-location';

interface SignedInViewProps {
  colors: {
    background: string;
    text: string;
    secondaryText: string;
    buttonBackground: string;
    inputBackground?: string;
    inputBorder?: string;
    accent: string;
  };
  user: User;
  handleSignOut: () => void;
}

// Names for fake users
const FAKE_USER_NAMES = [
  "Alex Johnson", "Taylor Smith", "Jordan Brown", "Casey Williams", "Morgan Davis",
  "Riley Wilson", "Jamie Jones", "Avery Miller", "Blake Moore", "Quinn Thompson",
  "Cameron White", "Jordan Harris", "Drew Martin", "Jesse Garcia", "Reese Anderson"
];

export function SignedInView({ colors, user, handleSignOut }: SignedInViewProps) {
  const { error, updateProfilePicture } = useUser();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back'); // Default to back camera
  const [permission, requestPermission] = useCameraPermissions();
  const { favorites } = useFavorite();
  const router = useRouter();
  
  // Debug state
  const [debugTapsCount, setDebugTapsCount] = useState(0);
  const [showDebugOptions, setShowDebugOptions] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);
  const [numberOfFakeUsers, setNumberOfFakeUsers] = useState("5");
  const [nearbyLocations, setNearbyLocations] = useState<NearbyLocation[]>([]);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [creationProgress, setCreationProgress] = useState("");

  // Check if on development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleFavoritesPress = () => {
    router.push('/favorites');
  };

  const handleProfileNamePress = () => {
    // Increment debug tap counter
    const newCount = debugTapsCount + 1;
    setDebugTapsCount(newCount);
    
    // Show debug options if tapped 5 times
    if (newCount >= 5) {
      setShowDebugOptions(true);
      setDebugTapsCount(0);
    }
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ base64: true });
        console.log('photo', photo);
        if (photo && photo.base64) {
          console.log('Base64 Image:', photo.base64);
          try {
            await updateProfilePicture(photo.base64);
            Alert.alert("Success", "Profile picture updated successfully!");
          } catch (err) {
            Alert.alert("Error", "Failed to update profile picture.");
            console.error('Image processing error:', err);
          }
        }
        setCameraVisible(false);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert("Error", "Failed to take picture.");
        setCameraVisible(false);
      }
    }
  };

  // Function to fetch nearby locations
  const fetchLocations = async () => {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Error", "Location permission is required to create fake users");
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const setLoading = (val: boolean) => {};
      const setError = (val: string | null) => {};
      
      // Fetch nearby places
      const places = await fetchNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        setLoading,
        setError
      );
      
      setNearbyLocations(places);
      return places;
    } catch (error) {
      console.error('Error fetching locations:', error);
      Alert.alert("Error", "Failed to fetch nearby locations");
      return [];
    }
  };

  // Function to create fake users
  const createFakeUsers = async () => {
    setIsCreatingUsers(true);
    setCreationProgress("Fetching nearby locations...");
    
    const locations = await fetchLocations();
    if (!locations || locations.length === 0) {
      setIsCreatingUsers(false);
      setCreationProgress("");
      Alert.alert("Error", "No nearby locations found");
      return;
    }
    
    const numUsers = parseInt(numberOfFakeUsers, 10) || 5;
    
    try {
      setCreationProgress(`Creating ${numUsers} fake users...`);
      
      // Create users one by one
      for (let i = 0; i < numUsers; i++) {
        // Get a random location
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        // Generate a random name
        const name = FAKE_USER_NAMES[Math.floor(Math.random() * FAKE_USER_NAMES.length)];
        
        // Create a random email based on the name
        const randomNum = Math.floor(Math.random() * 10000);
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${randomNum}@example.com`;
        
        // Create the user
        const userData = {
          name: name,
          email: email,
          password: "password123",
        };
        
        setCreationProgress(`Creating user ${i+1}/${numUsers}: ${name}`);
        
        try {
          // Register the user
          const createdUser = await authApi.register(userData);
          
          // Check in the user at the location
          if (createdUser) {
            setCreationProgress(`Checking in user ${i+1}/${numUsers} at ${location.name}`);
            
            // Make a direct API call to check in the user at the location
            await fetch(`http://44.203.161.109:8080/api/users/checkin?email=${email}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                latitude: location.location.latitude,
                longitude: location.location.longitude,
              }),
            });
          }
        } catch (error) {
          console.error(`Error creating user ${i+1}:`, error);
          setCreationProgress(`Error creating user ${i+1}: ${error}`);
          // Continue with the next user
        }
      }
      
      setCreationProgress("All users created successfully! Refreshing locations...");
      
      // Force the app to refresh by navigating to the home tab
      setTimeout(() => {
        // Close the modal and show success message
        setIsCreatingUsers(false);
        setCreationProgress("");
        setDebugModalVisible(false);
        
        // Redirect to home tab to refresh the locations
        router.push('/(tabs)');
        
        // Show success alert
        setTimeout(() => {
          Alert.alert("Success", `Created ${numUsers} fake users at random nearby locations. The locations list has been refreshed.`);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error('Error creating fake users:', error);
      setCreationProgress(`Error: ${error}`);
      setTimeout(() => {
        setIsCreatingUsers(false);
        setCreationProgress("");
      }, 2000);
    }
  };

  const toggleCameraType = () => {
    console.log('Toggling camera type. Current type:', cameraType); // Debugging
    setCameraType((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CameraView 
          style={styles.camera} 
          ref={ref => setCameraRef(ref)}
          facing={cameraType}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.switchCameraButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setCameraVisible(false)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraHeaderText}>Take Profile Picture</Text>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={[styles.avatarContainer, { backgroundColor: colors.buttonBackground }]}
            onPress={() => setCameraVisible(true)}
          >
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons name="person" size={32} color={colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfileNamePress} style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{user.email}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}
          onPress={handleFavoritesPress}
        >
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>
            Favorite Places
            {favorites.length > 0 && (
              <Text style={[styles.favoritesCount, { color: colors.secondaryText }]}>
                {' '}({favorites.length})
              </Text>
            )}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}
        >
          <Ionicons name="map-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>My Routes</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
        
        {/* Debug button - only visible after 5 taps on the name */}
        {showDebugOptions && (
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: '#7b1fa2' }]}
            onPress={() => setDebugModalVisible(true)}
          >
            <Ionicons name="bug-outline" size={24} color="#ffffff" />
            <Text style={[styles.menuItemText, { color: '#ffffff' }]}>
              Create Fake Users
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.buttonBackground }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: '#FF3B30' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      
      {/* Debug Modal for creating fake users */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={debugModalVisible}
        onRequestClose={() => setDebugModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Fake Users</Text>
              <TouchableOpacity 
                onPress={() => setDebugModalVisible(false)}
                disabled={isCreatingUsers}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {isCreatingUsers ? (
              <View style={styles.creatingUsersContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.creatingUsersText, { color: colors.text }]}>
                  {creationProgress}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalDescription, { color: colors.secondaryText }]}>
                  This will create fake users at random nearby locations.
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Number of users:</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: colors.inputBackground || colors.buttonBackground,
                        borderColor: colors.inputBorder || colors.secondaryText,
                        color: colors.text
                      }
                    ]}
                    value={numberOfFakeUsers}
                    onChangeText={setNumberOfFakeUsers}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor={colors.secondaryText}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.accent }]}
                  onPress={createFakeUsers}
                >
                  <Text style={styles.createButtonText}>Create Fake Users</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuContainer: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  favoritesCount: {
    fontSize: 14,
  },
  signOutButton: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  switchCameraButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 15,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 15,
  },
  cameraHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  // Debug Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalDescription: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  createButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  creatingUsersContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  creatingUsersText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
});