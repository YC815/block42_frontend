/**
 * Block42 Frontend - 創作工作室區域 Layout
 * 創作者儀表板、關卡編輯器（需要認證）
 */

import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { NavbarProvider } from "@/components/layout/navbar-context";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <NavbarProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<div className="h-16 border-b bg-white" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 bg-gray-50">{children}</main>
        </div>
      </NavbarProvider>
    </ProtectedRoute>
  );
}
