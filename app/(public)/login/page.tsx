"use client";

/**
 * Block42 Frontend - Login Page
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnUrl, setReturnUrl] = useState("/levels");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextReturnUrl = params.get("returnUrl");
    if (nextReturnUrl) {
      setReturnUrl(nextReturnUrl);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
      toast.success("登入成功");
      router.push(returnUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登入失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登入 Block42</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="on">
          <div>
            <label className="text-sm font-medium" htmlFor="login-username">
              帳號
            </label>
            <Input
              id="login-username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="輸入使用者名稱"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="login-password">
              密碼
            </label>
            <Input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="輸入密碼"
              autoComplete="current-password"
              required
            />
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "登入中..." : "登入"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
      <LoginForm />
    </div>
  );
}
