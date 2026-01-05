/**
 * Block42 Frontend - API 回應展示組件
 * 統一的 API 回應展示界面
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ResponseDisplayProps {
  response: {
    status: number;
    data?: unknown;
    error?: string;
  } | null;
}

export function ResponseDisplay({ response }: ResponseDisplayProps) {
  if (!response) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">API 回應</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            尚未發送請求
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;
  const statusColor = isSuccess
    ? "bg-green-500"
    : response.status >= 400 && response.status < 500
    ? "bg-yellow-500"
    : "bg-red-500";

  const displayData = response.error
    ? { error: response.error }
    : response.data;

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">API 回應</CardTitle>
          <Badge className={statusColor}>
            {response.status} {isSuccess ? "成功" : "失敗"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={JSON.stringify(displayData, null, 2)}
          className="font-mono text-xs min-h-[200px]"
        />
      </CardContent>
    </Card>
  );
}
