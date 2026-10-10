"use client";

/**
 * Block42 Frontend - Register Page
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard, FormField } from "@/components/layout/auth-card";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("兩次輸入的密碼不一樣");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await register(username, password);
      await login(username, password);
      router.push("/levels");
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="建立帳號"
      subtitle="有帳號才能記錄進度、設計自己的關卡。"
      footer={
        <>
          已經有帳號了？
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            登入
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField id="register-username" label="帳號" hint="2 到 32 字，可用中英文、數字、底線或連字號。">
          <Input
            id="register-username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            minLength={2}
            maxLength={32}
            required
          />
        </FormField>
        <FormField id="register-password" label="密碼" hint="至少 8 個字。">
          <Input
            id="register-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </FormField>
        <FormField id="register-confirm" label="再輸入一次密碼">
          <Input
            id="register-confirm"
            name="confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </FormField>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "建立中…" : "建立帳號"}
        </Button>
      </form>
    </AuthCard>
  );
}
