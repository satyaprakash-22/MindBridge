import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/services/api';

interface User {
  id: string;
  username?: string;
  email?: string;
  role: 'youth' | 'mentor' | 'admin';
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  youthLogin: (data: any) => Promise<void>;
  mentorLogin: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string, adminKey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('mindbridge_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('mindbridge_user');
      }
    }
    setIsLoading(false);
  }, []);

  const youthLogin = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await authAPI.youthLogin(data);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const mentorLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authAPI.mentorLogin(email, password);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string, adminKey: string) => {
    setIsLoading(true);
    try {
      const result = await authAPI.adminLogin(email, password, adminKey);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mindbridge_user');
    localStorage.removeItem('mindbridge_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, youthLogin, mentorLogin, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
