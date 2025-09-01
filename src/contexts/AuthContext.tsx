
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseAuthService } from '../services/supabaseAuthService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer' | 'salesperson';
  lastLogin: Date;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
  loading: boolean; // alias for isLoading for backward compatibility
  isAdmin: () => boolean;
  hasRole: (role: 'admin' | 'manager' | 'viewer' | 'salesperson') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    try {
      await supabaseAuthService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const hasRole = (role: 'admin' | 'manager' | 'viewer' | 'salesperson') => {
    if (!user) return false;
    const roleHierarchy = { salesperson: 1, viewer: 1, manager: 2, admin: 3 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[role];
    return userLevel >= requiredLevel;
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isLoading,
    loading: isLoading, // alias for backward compatibility
    isAdmin,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
