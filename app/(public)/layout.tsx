/**
 * Block42 Frontend - 公開區域 Layout
 * 首頁、登入、註冊頁面使用（無需認證）
 */

import { Navbar } from "@/components/layout/navbar";
import { NavbarProvider } from "@/components/layout/navbar-context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavbarProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </div>
    </NavbarProvider>
  );
}
