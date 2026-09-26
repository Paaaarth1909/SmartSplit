"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthUser,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  loginUser,
  registerUser,
  forgotPasswordUser,
  getMe,
} from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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

  const resetPassword = async (email: string, newPassword: string) => {
    const res = await forgotPasswordUser({ email, newPassword });
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

  useEffect(() => {
    if (user?.preferences?.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (user?.preferences?.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
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
        resetPassword,
        logout,
        refreshUser,
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
