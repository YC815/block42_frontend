"use client";

/**
 * Block42 Frontend - Studio Dashboard
 */

import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyLevels, deleteLevel } from "@/lib/api/designer";
import { LevelTable } from "@/components/studio/level-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StudioDashboardPage() {
  const levelsQuery = useQuery({
    queryKey: ["designer", "levels"],
    queryFn: getMyLevels,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLevel,
    onSuccess: () => {
      toast.success("已刪除關卡");
      levelsQuery.refetch();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "刪除失敗");
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的關卡</h1>
            <p className="text-gray-600">管理你的創作並提交審核。</p>
          </div>
          <Link href="/studio/editor/new">
            <Button>建立新關卡</Button>
          </Link>
        </div>

        {levelsQuery.isLoading && <div>載入中...</div>}
        {levelsQuery.isError && (
          <div className="text-red-500">載入失敗</div>
        )}
        {levelsQuery.data && levelsQuery.data.length === 0 && (
          <div className="text-gray-500">尚未建立關卡</div>
        )}
        {levelsQuery.data && levelsQuery.data.length > 0 && (
          <LevelTable
            levels={levelsQuery.data}
            onDelete={(levelId) => deleteMutation.mutate(levelId)}
          />
        )}
      </div>
    </div>
  );
}
