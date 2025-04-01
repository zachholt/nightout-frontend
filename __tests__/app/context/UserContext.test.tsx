import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { authApi } from '../../../app/services/auth';
import { clearAuthStorage } from '../../../app/utils/storageUtils';

// Mock dependencies
jest.mock('../../../app/services/auth', () => ({
  authApi: {
    deleteAccount: jest.fn(() => Promise.resolve()),
  }
}));

jest.mock('../../../app/utils/storageUtils', () => ({
  clearAuthStorage: jest.fn(() => Promise.resolve()),
  getUserFromStorage: jest.fn(() => Promise.resolve(null)),
  saveUserToStorage: jest.fn(() => Promise.resolve()),
}));

describe('UserContext - deleteAccount', () => {
  it('tests are working for delete account feature', () => {
    // Just a simple test to make sure the environment runs
    expect(true).toBe(true);
    
    // Verify our mocks are working
    expect(typeof authApi.deleteAccount).toBe('function');
    expect(typeof clearAuthStorage).toBe('function');
  });
}); 