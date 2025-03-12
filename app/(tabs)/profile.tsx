import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type AuthResponse } from '@/services/auth';
import { SignedOutView } from './components/SignedOutView';
import { SignedInView } from './components/SignedInView';
import { useUser, User } from '../context/UserContext';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const { user, setUser } = useUser();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Update isSignedIn when user changes
  useEffect(() => {
    setIsSignedIn(!!user);
  }, [user]);

  const colors = {
    background: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    secondaryText: colorScheme === 'dark' ? '#8E8E93' : '#666666',
    accent: '#007AFF',
    buttonBackground: colorScheme === 'dark' ? '#2C2C2E' : '#F0F0F0',
    inputBackground: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
    inputBorder: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
  };

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
        profileImage: 'https://via.placeholder.com/150',
        coordinates: '0,0',
      };
      setUser(userData);
      setIsSignedIn(true);
      
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
      const userData: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        createdAt: new Date().toISOString(),
        profileImage: 'https://via.placeholder.com/150',
        coordinates: '0,0',
      };
      setUser(userData);
      setIsSignedIn(true);
      
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
      setUser(null);
      setIsSignedIn(false);
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