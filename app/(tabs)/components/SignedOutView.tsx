import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignedOutViewProps {
  colors: {
    text: string;
    secondaryText: string;
    accent: string;
    buttonBackground: string;
    inputBackground: string;
  };
  isLogin: boolean;
  name: string;
  email: string;
  password: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  handleSignIn: () => void;
  handleCreateAccount: () => void;
  setIsLogin: (isLogin: boolean) => void;
}

export function SignedOutView({
  colors,
  isLogin,
  name,
  email,
  password,
  setName,
  setEmail,
  setPassword,
  handleSignIn,
  handleCreateAccount,
  setIsLogin,
}: SignedOutViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to NightOut</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </Text>
        
        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <Ionicons name="person-outline" size={20} color={colors.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Name"
                placeholderTextColor={colors.secondaryText}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="mail-outline" size={20} color={colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.secondaryText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.secondaryText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: colors.accent }]}
          onPress={isLogin ? handleSignIn : handleCreateAccount}
        >
          <Text style={styles.signInButtonText}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={[styles.toggleText, { color: colors.accent }]}>
            {isLogin ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </Text>
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
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  buttonContainer: {
    paddingBottom: 32,
    gap: 12,
  },
  signInButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
}); 