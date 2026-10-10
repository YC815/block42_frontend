"use client";

/**
 * Block42 Frontend - Login Page
 */

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, FormField } from "@/components/layout/auth-card";
import { useAuth } from "@/lib/auth-context";
import { safeReturnPath } from "@/lib/safe-redirect";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      const params = new URLSearchParams(window.location.search);
      window.location.assign(safeReturnPath(params.get("returnUrl")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="登入"
      subtitle="登入後會記錄你的關卡進度與程式。"
      footer={
        <>
          還沒有帳號？
          <Link href="/register" className="font-medium text-ink underline underline-offset-4">
            註冊
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField id="login-username" label="帳號">
          <Input
            id="login-username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </FormField>
        <FormField id="login-password" label="密碼">
          <Input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </FormField>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "登入中…" : "登入"}
        </Button>
      </form>
    </AuthCard>
  );
}
