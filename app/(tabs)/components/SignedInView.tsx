import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, User } from '../../context/UserContext';
import { useFavorite } from '../../context/FavoriteContext';
import { useRouter } from 'expo-router';

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
  const { error } = useUser();
  const { favorites } = useFavorite();
  const router = useRouter();

  const handleFavoritesPress = () => {
    router.push('/favorites');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.buttonBackground }]}>
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons name="person" size={32} color={colors.text} />
            )}
          </View>
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

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}>
          <Ionicons name="map-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>My Routes</Text>
          <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}>
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
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
}); 