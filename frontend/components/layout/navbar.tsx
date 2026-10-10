"use client";

/**
 * Block42 Frontend - 導航列
 * 桌機顯示橫向連結；手機收進選單按鈕。
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function BrandMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect x="1" y="1" width="14" height="14" rx="4" fill="var(--tile-r)" />
      <rect x="17" y="1" width="14" height="14" rx="4" fill="var(--tile-g)" />
      <rect x="1" y="17" width="14" height="14" rx="4" fill="var(--tile-b)" />
      <rect x="17" y="17" width="14" height="14" rx="4" fill="var(--ink)" />
      <path d="M24 20.5l3.5 7h-7z" fill="#fff" />
    </svg>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/tutorial", label: "教學" },
    { href: "/levels", label: "關卡" },
    { href: "/studio", label: "創作工作室" },
    ...(user?.is_superuser ? [{ href: "/admin/dashboard", label: "管理後台" }] : []),
  ];
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/levels" && pathname.startsWith("/play"));

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success("已登出");
  };

  const loginHref = `/login?returnUrl=${encodeURIComponent(pathname)}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-[1320px] items-center gap-6 px-4 sm:px-6" aria-label="主選單">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <BrandMark />
          <span className="text-lg font-bold tracking-tight text-ink">Block42</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive(link.href) ? "bg-paper-deep text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-ink transition hover:bg-paper-deep"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                    {user?.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[10rem] truncate">{user?.username}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="px-2 py-1.5 text-xs text-ink-soft">
                  {user?.is_superuser ? "管理員" : "玩家"}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition hover:bg-paper-deep"
                >
                  <LogOut className="h-4 w-4" />
                  登出
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={loginHref}>登入</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">註冊</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-ink md:hidden"
          aria-label={open ? "關閉選單" : "開啟選單"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper px-4 pb-4 pt-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block rounded-lg px-3 py-2.5 text-base font-medium ${
                isActive(link.href) ? "bg-paper-deep text-ink" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-line pt-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-ink-soft">{user?.username}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  登出
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 px-3">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={loginHref} onClick={() => setOpen(false)}>登入</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/register" onClick={() => setOpen(false)}>註冊</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
