"use client";

/**
 * Block42 Frontend - Admin dashboard
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { getReviewQueue, approveLevel, rejectLevel } from "@/lib/api/admin";
import { ReviewQueue } from "@/components/admin/review-queue";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const queueQuery = useQuery({
    queryKey: ["admin", "queue"],
    queryFn: getReviewQueue,
  });

  const approveMutation = useMutation({
    mutationFn: (payload: { levelId: string; asOfficial: boolean; officialOrder?: number }) =>
      approveLevel(payload.levelId, {
        as_official: payload.asOfficial,
        official_order: payload.officialOrder,
      }),
    onSuccess: () => {
      toast.success("已通過關卡");
      queueQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "操作失敗");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { levelId: string; reason: string }) =>
      rejectLevel(payload.levelId, { reason: payload.reason }),
    onSuccess: () => {
      toast.success("已駁回關卡");
      queueQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "操作失敗");
    },
  });

  return (
    <div className="min-h-screen bg-red-50 px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">審核隊列</h1>
          <p className="text-gray-600">管理待審核關卡。</p>
        </div>

        {queueQuery.isLoading && <div>載入中...</div>}
        {queueQuery.isError && <div className="text-red-500">載入失敗</div>}
        {queueQuery.data && queueQuery.data.length === 0 && (
          <div className="text-gray-500">目前沒有待審核關卡</div>
        )}
        {queueQuery.data && queueQuery.data.length > 0 && (
          <ReviewQueue
            levels={queueQuery.data}
            onApprove={(payload) => approveMutation.mutate(payload)}
            onReject={(payload) => rejectMutation.mutate(payload)}
          />
        )}
      </div>
    </div>
  );
}
