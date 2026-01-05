"use client";

/**
 * Block42 Frontend - API 測試主頁面
 * 單頁測試工具，包含所有 API 端點測試
 */

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthSection } from "@/components/api-test/auth-section";
import { LevelsSection } from "@/components/api-test/levels-section";
import { DesignerSection } from "@/components/api-test/designer-section";
import { AdminSection } from "@/components/api-test/admin-section";
import { Badge } from "@/components/ui/badge";

export default function ApiTestPage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">載入中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      {/* 頁面標題和用戶狀態 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Block42 API Test Dashboard</h1>
          <p className="text-muted-foreground mt-2">API 測試工具 - 測試所有後端端點</p>
        </div>
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.username}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{user.is_superuser ? "Superuser" : "普通用戶"}</Badge>
                <Badge variant="secondary">ID: {user.id}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              登出
            </Button>
          </div>
        )}
      </div>

      {/* 主要內容 - Tabs */}
      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auth">認證 API</TabsTrigger>
          <TabsTrigger value="levels">公開關卡</TabsTrigger>
          <TabsTrigger value="designer" disabled={!isAuthenticated}>
            Designer API {!isAuthenticated && "🔒"}
          </TabsTrigger>
          <TabsTrigger value="admin" disabled={!user?.is_superuser}>
            Admin API {!user?.is_superuser && "🔒"}
          </TabsTrigger>
        </TabsList>

        {/* Auth API Tab */}
        <TabsContent value="auth" className="mt-6">
          <AuthSection />
        </TabsContent>

        {/* Public Levels API Tab */}
        <TabsContent value="levels" className="mt-6">
          <LevelsSection />
        </TabsContent>

        {/* Designer API Tab */}
        <TabsContent value="designer" className="mt-6">
          <DesignerSection />
        </TabsContent>

        {/* Admin API Tab */}
        <TabsContent value="admin" className="mt-6">
          <AdminSection />
        </TabsContent>
      </Tabs>

      {/* 使用說明 */}
      <div className="mt-8 p-4 bg-muted rounded-lg text-sm space-y-2">
        <p className="font-semibold">📝 使用說明：</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>先在「認證 API」中註冊或登入帳號</li>
          <li>使用「快速填充」按鈕可自動填入測試資料</li>
          <li>登入後可訪問 Designer API（需認證）</li>
          <li>Admin API 需要 Superuser 權限（使用後端腳本提升）</li>
          <li>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}</li>
        </ul>
      </div>
    </div>
  );
}
