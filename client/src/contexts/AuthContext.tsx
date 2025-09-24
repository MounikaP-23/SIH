import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import i18n from '../i18n';

interface User {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: 'Student' | 'Teacher' | 'Admin' | 'Parent';
  age?: number;
  classLevel?: number;
  languagePreference?: 'en' | 'hi' | 'pa';
  studentCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: string,
    age?: number,
    classLevel?: number,
    languagePreference?: 'en' | 'hi' | 'pa'
  ) => Promise<{ user: User }>;
  requestOtp: (mobile: string) => Promise<{ code?: string }>;
  verifyOtp: (mobile: string, code: string, name?: string, preferredLanguage?: 'en' | 'hi' | 'pa') => Promise<{ user: User }>;
  logout: () => void;
  loading: boolean;
  fetchChildren: () => Promise<any[]>;
  fetchChildrenProgress: () => Promise<any>;
  linkChild: (studentCode: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          setUser(response.data.user);
          if (response.data.user?.languagePreference) {
            i18n.changeLanguage(response.data.user.languagePreference);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // OTP (Parent) auth - defined at component scope
  const requestOtp = async (mobile: string) => {
    try {
      const res = await axios.post('/api/auth/otp/request', { mobile: mobile.trim() });
      return { code: res.data?.code };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to request OTP';
      throw new Error(message);
    }
  };

  const verifyOtp = async (
    mobile: string,
    code: string,
    name?: string,
    preferredLanguage: 'en' | 'hi' | 'pa' = 'en'
  ) => {
    try {
      const res = await axios.post('/api/auth/otp/verify', {
        mobile: mobile.trim(),
        code: code.trim(),
        name,
        preferredLanguage
      });
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      if (userData?.languagePreference) {
        i18n.changeLanguage(userData.languagePreference);
      }
      return { user: userData };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify OTP';
      throw new Error(message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const payload = { email: email.trim().toLowerCase(), password: password.trim() };
      const response = await axios.post('/api/auth/login', payload);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      if (userData?.languagePreference) {
        i18n.changeLanguage(userData.languagePreference);
      }
      return { user: userData };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: string,
    age?: number,
    classLevel?: number,
    languagePreference?: 'en' | 'hi' | 'pa'
  ) => {
    try {
      const response = await axios.post('/api/auth/signup', { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password: password.trim(), 
        role,
        age,
        classLevel,
        languagePreference
      });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      if (userData?.languagePreference) {
        i18n.changeLanguage(userData.languagePreference);
      }
      return { user: userData };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    signup,
    requestOtp,
    verifyOtp,
    logout,
    loading,
    // New method to fetch parent's children
    fetchChildren: async () => {
      try {
        const res = await axios.get('/api/auth/parent/children');
        return res.data.children || [];
      } catch (error) {
        console.error('Failed to fetch children:', error);
        return [];
      }
    },
    // New method to fetch parent's children progress
    fetchChildrenProgress: async () => {
      try {
        const res = await axios.get('/api/lessons/parent/children-progress');
        return res.data.childrenProgress || {};
      } catch (error) {
        console.error('Failed to fetch children progress:', error);
        return {};
      }
    },
    // New method to link child by studentCode
    linkChild: async (studentCode: string) => {
      try {
        const res = await axios.post('/api/auth/parent/link-child', { studentCode });
        return res.data;
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to link child';
        throw new Error(message);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
