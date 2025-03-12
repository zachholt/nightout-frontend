import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser, User } from '../../context/UserContext';

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
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.profileImage || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
            {user.email}
          </Text>
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
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.buttonBackground }]}>
          <Ionicons name="heart-outline" size={24} color={colors.text} />
          <Text style={[styles.menuItemText, { color: colors.text }]}>Favorite Places</Text>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 8,
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
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  signOutButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 