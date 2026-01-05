"use client";

/**
 * Block42 Frontend - Admin API 測試區
 * 測試管理員審核功能（需 Superuser 權限）
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponseDisplay } from "./response-display";
import { apiClient } from "@/lib/api-client";
import type { Level } from "@/types/api";

export function AdminSection() {
  // 審核隊列狀態
  const [queueResponse, setQueueResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);

  // 批准關卡狀態
  const [approveId, setApproveId] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [officialOrder, setOfficialOrder] = useState("");
  const [approveResponse, setApproveResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // 駁回關卡狀態
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectResponse, setRejectResponse] = useState<{
    status: number;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // 列出待審核隊列
  const handleGetQueue = async () => {
    setQueueLoading(true);
    try {
      const data = await apiClient({
        method: "GET",
        endpoint: "/api/v1/admin/queue",
        requiresAuth: true,
      });
      setQueueResponse({ status: 200, data });
    } catch (error) {
      setQueueResponse({
        status: 403,
        error: error instanceof Error ? error.message : "獲取失敗（需 Superuser 權限）",
      });
    } finally {
      setQueueLoading(false);
    }
  };

  // 批准關卡
  const handleApprove = async () => {
    if (!approveId) {
      setApproveResponse({ status: 400, error: "請輸入關卡 ID" });
      return;
    }

    setApproveLoading(true);
    try {
      const body: { as_official?: boolean; official_order?: number } = {};
      if (isOfficial) {
        body.as_official = true;
        if (officialOrder) {
          body.official_order = parseInt(officialOrder);
        }
      }

      const data = await apiClient<Level>({
        method: "POST",
        endpoint: `/api/v1/admin/levels/${approveId}/approve`,
        body,
        requiresAuth: true,
      });
      setApproveResponse({ status: 200, data });
    } catch (error) {
      setApproveResponse({
        status: 403,
        error: error instanceof Error ? error.message : "批准失敗",
      });
    } finally {
      setApproveLoading(false);
    }
  };

  // 駁回關卡
  const handleReject = async () => {
    if (!rejectId) {
      setRejectResponse({ status: 400, error: "請輸入關卡 ID" });
      return;
    }
    if (!rejectReason) {
      setRejectResponse({ status: 400, error: "請輸入駁回理由" });
      return;
    }

    setRejectLoading(true);
    try {
      const data = await apiClient<Level>({
        method: "POST",
        endpoint: `/api/v1/admin/levels/${rejectId}/reject`,
        body: { reason: rejectReason },
        requiresAuth: true,
      });
      setRejectResponse({ status: 200, data });
    } catch (error) {
      setRejectResponse({
        status: 403,
        error: error instanceof Error ? error.message : "駁回失敗",
      });
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 提示訊息 */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-6">
          <p className="text-sm text-purple-800">
            ⚠️ 此區域需要 <span className="font-semibold">Superuser</span> 權限
          </p>
          <p className="text-xs text-purple-600 mt-1">
            請先註冊賬號，然後使用後端腳本提升權限：
            <code className="ml-1 bg-purple-100 px-2 py-0.5 rounded">
              python scripts/create-superuser.py admin
            </code>
          </p>
        </CardContent>
      </Card>

      {/* 審核隊列 */}
      <Card>
        <CardHeader>
          <CardTitle>GET /api/v1/admin/queue - 列出待審核關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            獲取所有 status=PENDING 的關卡
          </p>
          <Button onClick={handleGetQueue} disabled={queueLoading}>
            {queueLoading ? "獲取中..." : "列出審核隊列"}
          </Button>
          <ResponseDisplay response={queueResponse} />
        </CardContent>
      </Card>

      {/* 批准關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/v1/admin/levels/:id/approve - 批准關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="approve-id">關卡 ID</Label>
            <Input
              id="approve-id"
              value={approveId}
              onChange={(e) => setApproveId(e.target.value)}
              placeholder="輸入關卡 ID"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-official"
              checked={isOfficial}
              onChange={(e) => setIsOfficial(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is-official" className="cursor-pointer">
              設為官方關卡
            </Label>
          </div>
          {isOfficial && (
            <div>
              <Label htmlFor="official-order">官方關卡順序（可選）</Label>
              <Input
                id="official-order"
                type="number"
                value={officialOrder}
                onChange={(e) => setOfficialOrder(e.target.value)}
                placeholder="輸入順序編號"
              />
            </div>
          )}
          <Button onClick={handleApprove} disabled={approveLoading || !approveId}>
            {approveLoading ? "批准中..." : "批准關卡"}
          </Button>
          <ResponseDisplay response={approveResponse} />
        </CardContent>
      </Card>

      {/* 駁回關卡 */}
      <Card>
        <CardHeader>
          <CardTitle>POST /api/v1/admin/levels/:id/reject - 駁回關卡</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reject-id">關卡 ID</Label>
            <Input
              id="reject-id"
              value={rejectId}
              onChange={(e) => setRejectId(e.target.value)}
              placeholder="輸入關卡 ID"
            />
          </div>
          <div>
            <Label htmlFor="reject-reason">駁回理由</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="輸入駁回理由（會存儲在 metadata.reject_reason）"
              className="min-h-[80px]"
            />
          </div>
          <Button onClick={handleReject} disabled={rejectLoading || !rejectId || !rejectReason} variant="destructive">
            {rejectLoading ? "駁回中..." : "駁回關卡"}
          </Button>
          <ResponseDisplay response={rejectResponse} />
        </CardContent>
      </Card>
    </div>
  );
}
