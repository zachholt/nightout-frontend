import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthResponse } from '@/services/auth';
import { SignedOutView } from './components/SignedOutView';
import { SignedInView } from './components/SignedInView';

type User = {
  id: number;
  name: string;
  email: string;
  photoUrl?: string;
};

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const colors = {
    background: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    accent: '#007AFF',
    buttonBackground: colorScheme === 'dark' ? '#2C2C2E' : '#F0F0F0',
    inputBackground: colorScheme === 'dark' ? '#2C2C2E' : '#F0F0F0',
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      setIsSignedIn(true);
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        photoUrl: 'https://via.placeholder.com/150',
      });
      // Clear the form
      setEmail('');
      setPassword('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign in');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: AuthResponse) => {
      setIsSignedIn(true);
      setUser({
        id: data.id,
        name: data.name,
        email: data.email,
        photoUrl: 'https://via.placeholder.com/150',
      });
      // Clear the form
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create account');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setIsSignedIn(false);
      setUser(null);
      setEmail('');
      setPassword('');
      queryClient.clear();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to sign out');
    },
  });

  const handleSignIn = () => {
    loginMutation.mutate({ email, password });
  };

  const handleCreateAccount = () => {
    if (!name && !isLogin) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    registerMutation.mutate({ name, email, password });
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {isSignedIn && user ? (
        <SignedInView
          colors={colors}
          user={user}
          handleSignOut={handleSignOut}
        />
      ) : (
        <SignedOutView
          colors={colors}
          isLogin={isLogin}
          name={name}
          email={email}
          password={password}
          setName={setName}
          setEmail={setEmail}
          setPassword={setPassword}
          handleSignIn={handleSignIn}
          handleCreateAccount={handleCreateAccount}
          setIsLogin={setIsLogin}
        />
      )}
    </KeyboardAvoidingView>
  );
} 