/**
 * Block42 Frontend - 認證 API
 * 處理登入、註冊、取得當前使用者
 */

import { get, post } from "@/lib/api-client";
import type { User, UserLogin, UserRegister, AuthResponse } from "@/types/api";

/**
 * 使用者註冊
 */
export async function register(data: UserRegister): Promise<User> {
  return post<User>("/api/v1/auth/register", data);
}

/**
 * 使用者登入
 */
export async function login(data: UserLogin): Promise<AuthResponse> {
  return post<AuthResponse>("/api/v1/auth/login", data);
}

/**
 * 取得當前使用者資訊
 */
export async function getCurrentUser(): Promise<User> {
  return get<User>("/api/v1/auth/users/me", true);
}
