"use client";

/**
 * Block42 Frontend - React Query Provider
 * 封裝 QueryClientProvider 配置
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 在組件內部創建 QueryClient，確保每個請求都有新的實例
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 資料預設保鮮 5 分鐘
            staleTime: 5 * 60 * 1000,
            // 快取保留 10 分鐘
            gcTime: 10 * 60 * 1000,
            // 視窗重新聚焦時重新驗證
            refetchOnWindowFocus: true,
            // 網路重新連接時重新驗證
            refetchOnReconnect: true,
            // 失敗後不自動重試（避免過多 API 呼叫）
            retry: false,
          },
          mutations: {
            // Mutation 失敗後不重試
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開發環境顯示 DevTools */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
