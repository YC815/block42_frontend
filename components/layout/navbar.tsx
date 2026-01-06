"use client";

/**
 * Block42 Frontend - 導航列組件
 * 根據使用者狀態顯示不同的導航選項
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useNavbar } from "@/components/layout/navbar-context";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { levelInfo } = useNavbar();
  const pathname = usePathname();
  const [tabParam, setTabParam] = useState<string | null>(null);
  const isLevelsPage = pathname === "/levels";
  const isTutorialPage = pathname === "/tutorial";
  const isOfficialActive = isLevelsPage && (tabParam === "official" || !tabParam);
  const isCommunityActive = isLevelsPage && tabParam === "community";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const nextTab = params.get("tab");
    setTabParam((prev) => (prev === nextTab ? prev : nextTab));
  });

  const navLinkClass = (active: boolean) =>
    [
      "text-sm font-medium transition-colors",
      active ? "text-blue-600 underline underline-offset-8" : "hover:text-blue-600",
    ].join(" ");

  const handleLogout = () => {
    logout();
    toast.success("已登出");
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">B42</span>
            </div>
            <span className="text-xl font-bold">Block42</span>
          </Link>

          {levelInfo && (
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <div className="max-w-[320px] rounded-full border border-slate-200/70 bg-slate-50 px-4 py-2 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  {levelInfo.label}
                </div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {levelInfo.title}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* 官方關卡 */}
                <Link
                  href="/levels?tab=official"
                  className={navLinkClass(isOfficialActive)}
                >
                  官方關卡
                </Link>

                {/* 新手指引 */}
                <Link
                  href="/tutorial"
                  className={navLinkClass(isTutorialPage)}
                >
                  導覽模式
                </Link>

                {/* 社群關卡 */}
                <Link
                  href="/levels?tab=community"
                  className={navLinkClass(isCommunityActive)}
                >
                  社群關卡
                </Link>

                {/* 創作工作室 */}
                <Link
                  href="/studio"
                  className="text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  創作工作室
                </Link>

                {/* 管理員入口（僅顯示給管理員） */}
                {user?.is_superuser && (
                  <Link
                    href="/admin/dashboard"
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    管理後台
                  </Link>
                )}

                {/* 使用者選單 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {user?.username}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <div className="space-y-2">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-500">
                          {user?.is_superuser ? "管理員" : "一般使用者"}
                        </p>
                      </div>
                      <Separator />
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={handleLogout}
                      >
                        登出
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    登入
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">註冊</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
