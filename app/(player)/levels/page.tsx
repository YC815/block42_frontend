"use client";

/**
 * Block42 Frontend - Levels Lobby
 */

import { useQuery } from "@tanstack/react-query";
import { getOfficialLevels, getCommunityLevels } from "@/lib/api/levels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldMap } from "@/components/levels/world-map";
import { LevelCard } from "@/components/levels/level-card";

export default function LevelsPage() {
  const officialQuery = useQuery({
    queryKey: ["levels", "official"],
    queryFn: getOfficialLevels,
  });

  const communityQuery = useQuery({
    queryKey: ["levels", "community"],
    queryFn: getCommunityLevels,
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">關卡大廳</h1>
          <p className="text-gray-600">選擇官方訓練或社群挑戰開始遊玩。</p>
        </div>

        <Tabs defaultValue="official">
          <TabsList>
            <TabsTrigger value="official">官方特訓</TabsTrigger>
            <TabsTrigger value="community">社群挑戰</TabsTrigger>
          </TabsList>

          <TabsContent value="official" className="mt-6">
            {officialQuery.isLoading && <div>載入中...</div>}
            {officialQuery.isError && (
              <div className="text-red-500">載入失敗</div>
            )}
            {officialQuery.data && officialQuery.data.length === 0 && (
              <div className="text-gray-500">目前沒有官方關卡</div>
            )}
            {officialQuery.data && officialQuery.data.length > 0 && (
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <WorldMap levels={officialQuery.data} />
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
            {communityQuery.data && communityQuery.data.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {communityQuery.data.map((level) => (
                  <LevelCard key={level.id} level={level} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
