"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthUser,
  AuthResponse,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  loginUser,
  registerUser,
  requestPasswordResetOtp,
  forgotPasswordUser,
  getMe,
  API_BASE,
  getAuthHeaders,
} from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  requestResetOtp: (email: string) => Promise<AuthResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const currentUser = await getMe();
      setUser(currentUser);
    } catch (err) {
      console.warn("Session restore failed, logging out:", err);
      removeAuthToken();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    const res = await registerUser({ fullName, email, password, phone });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
    }
  };

  const requestResetOtp = async (email: string) => {
    return await requestPasswordResetOtp({ email });
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await forgotPasswordUser({ email, otp, newPassword });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getMe();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const setTheme = async (newTheme: 'dark' | 'light') => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartsplit_theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }

      setUser(prev => prev ? ({
        ...prev,
        preferences: {
          ...(prev.preferences || {}),
          theme: newTheme
        }
      }) : prev);

      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE}/users/me`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ theme: newTheme })
        }).catch(err => console.warn('Failed to sync theme with backend:', err));
      }
    } catch (err) {
      console.warn('Error setting theme:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('smartsplit_theme');
      const targetTheme = (savedTheme as 'dark' | 'light') || (user?.preferences?.theme as 'dark' | 'light') || 'dark';
      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, [user?.preferences?.theme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        requestResetOtp,
        resetPassword,
        logout,
        refreshUser,
        setTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
