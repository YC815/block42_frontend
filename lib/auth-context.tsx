"use client";

/**
 * Block42 Frontend - 認證狀態管理
 * React Context + in-memory/sessionStorage 混合方案（避免長期暴露在 localStorage）
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "./api-client";
import type { User, AuthResponse } from "@/types/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "./auth-token";

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<User>;
  logout: () => void;
  fetchCurrentUser: (tokenOverride?: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const maskToken = (value: string | null) => {
    if (!value) return null;
    return `${value.slice(0, 8)}...${value.slice(-6)}`;
  };

  // 初始化：從 localStorage 讀取 token
  useEffect(() => {
    const savedToken = getAuthToken();
    if (savedToken) {
      setToken(savedToken);
      // 自動獲取用戶資訊
      fetchCurrentUser().catch(() => {
        // Token 可能已過期，清除
        logout();
      });
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[auth] login request", { username });
    }
    const data = await apiClient<AuthResponse>({
      method: "POST",
      endpoint: "/api/v1/auth/login",
      body: { username, password },
    });

    setToken(data.access_token);
    setAuthToken(data.access_token);

    // 登錄成功後獲取用戶資訊
    if (process.env.NODE_ENV === "development") {
      console.log("[auth] login response", {
        token: maskToken(data.access_token),
        tokenType: data.token_type,
      });
    }
    await fetchCurrentUser(data.access_token);
  };

  const register = async (username: string, password: string): Promise<User> => {
    const user = await apiClient<User>({
      method: "POST",
      endpoint: "/api/v1/auth/register",
      body: { username, password },
    });
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthToken();
  };

  const fetchCurrentUser = async (tokenOverride?: string) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[auth] fetch current user", {
          token: maskToken(tokenOverride || getAuthToken()),
        });
      }
      const currentUser = await apiClient<User>({
        method: "GET",
        endpoint: "/api/v1/auth/users/me",
        requiresAuth: true,
        tokenOverride,
      });
      if (process.env.NODE_ENV === "development") {
        console.log("[auth] current user response", currentUser);
      }
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthState = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook - 獲取認證狀態
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth 必須在 AuthProvider 內使用");
  }
  return context;
}
