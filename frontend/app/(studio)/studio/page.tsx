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

  const handleDelete = (levelId: string) => {
    const level = levelsQuery.data?.find((item) => item.id === levelId);
    if (!confirm(`確定要刪除「${level?.title ?? "這個關卡"}」嗎？刪除後無法復原。`)) return;
    deleteMutation.mutate(levelId);
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">創作工作室</h1>
            <p className="mt-1 text-sm text-ink-soft">設計自己的關卡。自己解開之後送出審核，通過就會公開到社群關卡。</p>
          </div>
          <Button asChild>
            <Link href="/studio/editor/new">建立新關卡</Link>
          </Button>
        </div>

        {levelsQuery.isLoading && <p className="text-sm text-ink-soft">載入中…</p>}
        {levelsQuery.isError && <p className="text-sm text-destructive">載入失敗，請重新整理。</p>}
        {levelsQuery.data && levelsQuery.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-8">
            <p className="font-semibold text-ink">還沒有關卡</p>
            <ol className="mt-3 grid gap-3 text-sm text-ink-soft sm:grid-cols-4">
              {["畫地圖、放星星和起點", "設定可用的格數和油漆", "試玩，自己解開一次", "送出審核，通過後公開"].map(
                (step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-deep text-xs font-semibold text-ink">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                )
              )}
            </ol>
          </div>
        )}
        {levelsQuery.data && levelsQuery.data.length > 0 && (
          <LevelTable levels={levelsQuery.data} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
