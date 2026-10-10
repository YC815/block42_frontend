"use client";

/**
 * Block42 Frontend - 受保護路由組件
 * 驗證使用者是否已登入，未登入則重定向至登入頁
 */

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 儲存當前路徑，登入後可返回
      const returnUrl = encodeURIComponent(pathname ?? "/");
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // Loading 狀態：顯示載入中
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 未驗證：不渲染內容（等待重定向）
  if (!isAuthenticated) {
    return null;
  }

  // 已驗證：渲染子組件
  return <>{children}</>;
}
