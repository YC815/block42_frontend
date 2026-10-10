"use client";

/**
 * Block42 Frontend - 認證狀態管理
 * React Context + in-memory/sessionStorage 混合方案（避免長期暴露在 localStorage）
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiError, apiClient } from "./api-client";
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
}

const AuthContext = createContext<AuthState | null>(null);

function fetchCurrentUser(token: string) {
  return apiClient<User>({
    method: "GET",
    endpoint: "/api/v1/auth/users/me",
    requiresAuth: true,
    tokenOverride: token,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：sessionStorage 裡有 token 就向後端確認身分
  useEffect(() => {
    let active = true;
    const restore = async () => {
      const savedToken = getAuthToken();
      try {
        if (!savedToken) return;
        const currentUser = await fetchCurrentUser(savedToken);
        if (!active) return;
        setToken(savedToken);
        setUser(currentUser);
      } catch (error) {
        // 只有伺服器明確拒絕（過期或無效）才清掉；網路中斷或換頁中止的請求不算
        if (error instanceof ApiError && error.status === 401) {
          clearAuthToken();
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, []);

  const login = async (username: string, password: string) => {
    const data = await apiClient<AuthResponse>({
      method: "POST",
      endpoint: "/api/v1/auth/login",
      body: { username, password },
    });
    const currentUser = await fetchCurrentUser(data.access_token);
    setAuthToken(data.access_token);
    setToken(data.access_token);
    setUser(currentUser);
  };

  const register = (username: string, password: string) =>
    apiClient<User>({
      method: "POST",
      endpoint: "/api/v1/auth/register",
      body: { username, password },
    });

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthToken();
  };

  const value: AuthState = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
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
