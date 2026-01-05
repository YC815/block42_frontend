"use client";

/**
 * Block42 Frontend - 認證 API 測試區
 * 測試註冊、登入、獲取當前用戶功能
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponseDisplay } from "./response-display";
import { useAuth } from "@/lib/auth-context";
import { TEST_ACCOUNTS } from "@/lib/test-data";

export function AuthSection() {
  const { login, register, fetchCurrentUser, user, isAuthenticated } = useAuth();

  // 註冊表單狀態
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regResponse, setRegResponse] = useState<{ status: number; data?: unknown; error?: string } | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // 登入表單狀態
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginResponse, setLoginResponse] = useState<{ status: number; data?: unknown; error?: string } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // 獲取當前用戶狀態
  const [meResponse, setMeResponse] = useState<{ status: number; data?: unknown; error?: string } | null>(null);
  const [meLoading, setMeLoading] = useState(false);

  // 處理註冊
  const handleRegister = async () => {
    setRegLoading(true);
    try {
      const data = await register(regUsername, regPassword);
      setRegResponse({ status: 201, data });
    } catch (error) {
      setRegResponse({
        status: 400,
        error: error instanceof Error ? error.message : "註冊失敗",
      });
    } finally {
      setRegLoading(false);
    }
  };

  // 處理登入
  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await login(loginUsername, loginPassword);
      setLoginResponse({ status: 200, data: { message: "登入成功", user } });
    } catch (error) {
      setLoginResponse({
        status: 401,
        error: error instanceof Error ? error.message : "登入失敗",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // 獲取當前用戶
  const handleGetMe = async () => {
    setMeLoading(true);
    try {
      await fetchCurrentUser();
      setMeResponse({ status: 200, data: user });
    } catch (error) {
      setMeResponse({
        status: 401,
        error: error instanceof Error ? error.message : "獲取用戶失敗",
      });
    } finally {
      setMeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 當前認證狀態 */}
      {isAuthenticated && user && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-sm">
              ✅ 已登入：<span className="font-semibold">{user.username}</span>
              {user.is_superuser && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Superuser</span>}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 註冊 */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/v1/auth/register - 註冊新用戶</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reg-username">Username</Label>
            <Input
              id="reg-username"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="輸入用戶名"
            />
          </div>
          <div>
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="輸入密碼"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRegister} disabled={regLoading || !regUsername || !regPassword}>
              {regLoading ? "註冊中..." : "註冊"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRegUsername(TEST_ACCOUNTS.normalUser.username);
                setRegPassword(TEST_ACCOUNTS.normalUser.password);
              }}
            >
              快速填充（普通用戶）
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRegUsername(TEST_ACCOUNTS.superuser.username);
                setRegPassword(TEST_ACCOUNTS.superuser.password);
              }}
            >
              快速填充（Admin）
            </Button>
          </div>
          <ResponseDisplay response={regResponse} />
        </CardContent>
      </Card>

      {/* 登入 */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/v1/auth/login - 登入取得 Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="login-username">Username</Label>
            <Input
              id="login-username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="輸入用戶名"
            />
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="輸入密碼"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLogin} disabled={loginLoading || !loginUsername || !loginPassword}>
              {loginLoading ? "登入中..." : "登入"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLoginUsername(TEST_ACCOUNTS.normalUser.username);
                setLoginPassword(TEST_ACCOUNTS.normalUser.password);
              }}
            >
              快速填充（普通用戶）
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLoginUsername(TEST_ACCOUNTS.superuser.username);
                setLoginPassword(TEST_ACCOUNTS.superuser.password);
              }}
            >
              快速填充（Admin）
            </Button>
          </div>
          <ResponseDisplay response={loginResponse} />
        </CardContent>
      </Card>

      {/* 獲取當前用戶 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/auth/users/me - 獲取當前用戶資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">需要認證：使用當前 Token 獲取用戶資訊</p>
          <Button onClick={handleGetMe} disabled={meLoading || !isAuthenticated}>
            {meLoading ? "獲取中..." : "獲取當前用戶"}
          </Button>
          <ResponseDisplay response={meResponse} />
        </CardContent>
      </Card>
    </div>
  );
}
