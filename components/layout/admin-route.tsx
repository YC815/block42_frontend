"use client";

/**
 * Block42 Frontend - 管理員路由組件
 * 驗證使用者是否為管理員，非管理員則重定向至首頁
 */

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // 未登入：重定向至登入頁
        router.push("/login?returnUrl=/admin/dashboard");
      } else if (!user?.is_superuser) {
        // 已登入但非管理員：重定向至首頁並顯示錯誤訊息
        toast.error("您沒有權限訪問此頁面");
        router.push("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Loading 狀態：顯示載入中
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">驗證權限中...</p>
        </div>
      </div>
    );
  }

  // 未驗證或非管理員：不渲染內容（等待重定向）
  if (!isAuthenticated || !user?.is_superuser) {
    return null;
  }

  // 已驗證且為管理員：渲染子組件
  return <>{children}</>;
}
