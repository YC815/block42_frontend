"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOfficialLevels, getCommunityLevels, getLevelProgress } from "@/lib/api/levels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldMap } from "@/components/levels/world-map";
import { LevelCard } from "@/components/levels/level-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import type { LevelListItem, LevelProgress } from "@/types/api";

type LevelsPageClientProps = {
  initialOfficialLevels: LevelListItem[] | null;
  initialCommunityLevels: LevelListItem[] | null;
};

export function LevelsPageClient({
  initialOfficialLevels,
  initialCommunityLevels,
}: LevelsPageClientProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");

  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "community" ? "community" : "official";

  const officialQuery = useQuery({
    queryKey: ["levels", "official"],
    queryFn: getOfficialLevels,
    initialData: initialOfficialLevels ?? undefined,
    refetchOnMount: "always",
  });

  const communityQuery = useQuery({
    queryKey: ["levels", "community"],
    queryFn: getCommunityLevels,
    initialData: initialCommunityLevels ?? undefined,
    refetchOnMount: "always",
  });

  const progressQuery = useQuery({
    queryKey: ["levels", "progress"],
    queryFn: getLevelProgress,
    enabled: isAuthenticated,
    refetchOnMount: "always",
  });

  const progressMap = useMemo(() => {
    const map = new Map<string, LevelProgress>();
    progressQuery.data?.forEach((item) => {
      map.set(item.level_id, item);
    });
    return map;
  }, [progressQuery.data]);

  const effectiveFilter = isAuthenticated ? filter : "all";

  const filterLevels = (levels: LevelListItem[] | undefined | null) => {
    if (!levels) return [];
    if (effectiveFilter === "all") return levels;
    const wantCompleted = effectiveFilter === "completed";
    return levels.filter((level) => {
      const completed = Boolean(progressMap.get(level.id)?.is_completed);
      return wantCompleted ? completed : !completed;
    });
  };

  const officialLevels = filterLevels(officialQuery.data);
  const communityLevels = filterLevels(communityQuery.data);

  const activeStats = useMemo(() => {
    const levels =
      activeTab === "official" ? officialQuery.data : communityQuery.data;
    if (!levels) {
      return { completed: 0, total: 0 };
    }
    const completed = levels.reduce((count, level) => {
      if (progressMap.get(level.id)?.is_completed) return count + 1;
      return count;
    }, 0);
    return { completed, total: levels.length };
  }, [activeTab, officialQuery.data, communityQuery.data, progressMap]);

  const handleTabChange = (value: string) => {
    const nextTab = value === "community" ? "community" : "official";
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">關卡大廳</h1>
          <p className="text-gray-600">選擇官方訓練或社群挑戰開始遊玩。</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="official">官方特訓</TabsTrigger>
            <TabsTrigger value="community">社群挑戰</TabsTrigger>
          </TabsList>

          {isAuthenticated && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  進度
                </span>
                <span className="font-semibold text-slate-800">
                  已完成 {activeStats.completed}/{activeStats.total}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={effectiveFilter === "all" ? "default" : "secondary"}
                  onClick={() => setFilter("all")}
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant={effectiveFilter === "completed" ? "default" : "secondary"}
                  onClick={() => setFilter("completed")}
                >
                  已完成
                </Button>
                <Button
                  size="sm"
                  variant={effectiveFilter === "incomplete" ? "default" : "secondary"}
                  onClick={() => setFilter("incomplete")}
                >
                  未完成
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="official" className="mt-6">
            {officialQuery.isLoading && <div>載入中...</div>}
            {officialQuery.isError && (
              <div className="text-red-500">載入失敗</div>
            )}
            {officialQuery.data && officialQuery.data.length === 0 && (
              <div className="text-gray-500">目前沒有官方關卡</div>
            )}
            {officialQuery.data &&
              officialQuery.data.length > 0 &&
              officialLevels.length === 0 && (
                <div className="text-gray-500">沒有符合條件的官方關卡</div>
            )}
            {officialLevels.length > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <WorldMap
                  levels={officialLevels}
                  progressMap={progressMap}
                  showProgress={isAuthenticated}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            {communityQuery.isLoading && <div>載入中...</div>}
            {communityQuery.isError && (
              <div className="text-red-500">載入失敗</div>
            )}
            {communityQuery.data && communityQuery.data.length === 0 && (
              <div className="text-gray-500">目前沒有社群關卡</div>
            )}
            {communityQuery.data &&
              communityQuery.data.length > 0 &&
              communityLevels.length === 0 && (
                <div className="text-gray-500">沒有符合條件的社群關卡</div>
            )}
            {communityLevels.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {communityLevels.map((level) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    progress={progressMap.get(level.id)}
                    showProgress={isAuthenticated}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
