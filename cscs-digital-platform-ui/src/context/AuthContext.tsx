import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  username: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const login = async (credentials: { userId: string, password: string }) => {
    const response = await api.post('/auth/login', { username: credentials.userId, password: credentials.password });
    const { token, username, role, permissions } = response.data.data;

    const userData = { username, role, permissions: permissions || [] };
    localStorage.setItem('token', token);
    // NOTE: localStorage is intentionally used here. This is an internal dashboard app. For public-facing apps, consider httpOnly cookies instead.
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.delete('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          setLoading(true);
          const response = await api.get('/auth/me');
          if (!response.data?.success || !response.data?.data?.active) {
            await logout();
          }
        } catch (err) {
          console.error('Failed to verify token:', err);
          await logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
