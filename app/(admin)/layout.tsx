/**
 * Block42 Frontend - 管理後台區域 Layout
 * 審核隊列、關卡管理（需要管理員權限）
 */

import { Navbar } from "@/components/layout/navbar";
import { AdminRoute } from "@/components/layout/admin-route";
import { NavbarProvider } from "@/components/layout/navbar-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <NavbarProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 bg-red-50">{children}</main>
        </div>
      </NavbarProvider>
    </AdminRoute>
  );
}
