import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, User } from '../../context/UserContext';
import { useFavorite } from '../../context/FavoriteContext';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

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

export function SignedInView({ colors, user, handleSignOut }: SignedInViewProps) {
  const { error, updateProfilePicture } = useUser();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { favorites } = useFavorite();
  const router = useRouter();

  const handleFavoritesPress = () => {
    router.push('/favorites');
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
        <CameraView style={styles.camera} ref={ref => setCameraRef(ref)}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Ionicons name="camera" size={24} color="white" />
          </TouchableOpacity>
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
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{user.email}</Text>
          </View>
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
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: colors.buttonBackground }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: '#FF3B30' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    padding: 15,
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
  }
});