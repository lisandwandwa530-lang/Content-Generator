import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserSettings } from '../types.ts';
import { api, getStoredToken } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { error, success } = useToast();

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session verification failed, signing out:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      success(`Welcome back, ${data.user.name}!`);
    } catch (err: any) {
      error(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const data = await api.register(email, password, name);
      setUser(data.user);
      success(`Account created. Welcome to PromptStudio AI!`);
    } catch (err: any) {
      error(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      success('Signed out successfully.');
    } catch (err: any) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    try {
      const res = await api.updateSettings(settings);
      if (user) {
        setUser({ ...user, settings: res.settings });
      }
      success('Settings updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update settings');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateSettings,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
