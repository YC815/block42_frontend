"use client";

/**
 * Block42 Frontend - Register Page
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirm) {
      toast.error("兩次輸入的密碼不一致");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, password);
      await login(username, password);
      toast.success("註冊成功");
      router.push("/levels");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "註冊失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>建立新帳號</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">帳號</label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="輸入使用者名稱"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">密碼</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="輸入密碼"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">確認密碼</label>
              <Input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="再次輸入密碼"
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "註冊中..." : "註冊"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
