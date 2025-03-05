import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignedInViewProps {
  colors: {
    background: string;
    text: string;
    secondaryText: string;
    buttonBackground: string;
    inputBackground?: string;
    inputBorder?: string;
  };
  user: {
    name: string;
    email: string;
    photoUrl?: string;
  };
  handleSignOut: () => void;
}

export function SignedInView({ colors, user, handleSignOut }: SignedInViewProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: user.photoUrl }}
          style={styles.profileImage}
        />
        <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>{user.email}</Text>
      </View>

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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
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