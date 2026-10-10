"use client";

/* eslint-disable react-hooks/set-state-in-effect */

/**
 * Block42 Frontend - Shared editor page logic
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { LevelConfig, MapData, Solution } from "@/types/api";
import { getLevelById } from "@/lib/api/levels";
import { createLevel, updateLevel, publishLevel } from "@/lib/api/designer";
import { updateAdminLevel } from "@/lib/api/admin";
import { toast } from "sonner";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { SettingsPanel } from "@/components/editor/settings-panel";
import { PlaytestModal } from "@/components/editor/playtest-modal";
import { LevelJsonPanel } from "@/components/editor/level-json-panel";
import {
  compileMapData,
  computeContentBounds,
  DEFAULT_PADDING,
  ensureStartFloor,
  MAX_RENDER_SIZE,
  validateRenderSize,
} from "@/lib/map-utils";

const DEFAULT_MAP: MapData = {
  padding: DEFAULT_PADDING,
  start: { x: 0, y: 0, dir: 1 },
  stars: [],
  tiles: [{ x: 0, y: 0, color: "R" }],
};

const DEFAULT_CONFIG: LevelConfig = {
  f0: 10,
  f1: 0,
  f2: 0,
  tools: {
    paint_red: true,
    paint_green: false,
    paint_blue: false,
  },
};

interface EditorPageProps {
  levelId?: string;
  mode?: "designer" | "admin";
}

export function EditorPage({ levelId, mode = "designer" }: EditorPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("未命名關卡");
  const [mapData, setMapData] = useState<MapData>(() => ensureStartFloor(DEFAULT_MAP));
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [tool, setTool] = useState<"paint" | "erase" | "start" | "star">("paint");
  const [paintColor, setPaintColor] = useState<"R" | "G" | "B">("R");
  const [playtestPassed, setPlaytestPassed] = useState(false);
  const [playtestSolution, setPlaytestSolution] = useState<Solution | null>(null);
  const [isPlaytestOpen, setIsPlaytestOpen] = useState(false);
  const [playtestPayload, setPlaytestPayload] = useState<{
    title: string;
    map: MapData;
    config: LevelConfig;
  } | null>(null);

  const compiledMap = useMemo(() => compileMapData(mapData), [mapData]);
  const contentBounds = useMemo(() => computeContentBounds(mapData), [mapData]);
  const sizeCheck = useMemo(
    () => validateRenderSize(compiledMap, MAX_RENDER_SIZE),
    [compiledMap]
  );

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId as string),
    enabled: !!levelId,
  });

  useEffect(() => {
    if (levelQuery.data) {
      const incomingMap = ensureStartFloor({
        ...levelQuery.data.map,
        padding: levelQuery.data.map.padding ?? DEFAULT_MAP.padding,
      });
      setTitle(levelQuery.data.title);
      setMapData(incomingMap);
      setConfig(levelQuery.data.config);
    }
  }, [levelQuery.data]);

  const createMutation = useMutation({
    mutationFn: createLevel,
    onSuccess: (created) => {
      toast.success("已建立關卡");
      router.push(`/studio/editor/${created.id}`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "建立失敗");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { title: string; map: MapData; config: LevelConfig } }) =>
      updateLevel(payload.id, payload.data),
    onSuccess: () => toast.success("已儲存變更"),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "儲存失敗");
    },
  });

  const adminUpdateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { title: string; map: MapData; config: LevelConfig } }) =>
      updateAdminLevel(payload.id, payload.data),
    onSuccess: () => toast.success("已更新關卡"),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "更新失敗");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; data: { solution: Solution } }) =>
      publishLevel(payload.id, payload.data),
    onSuccess: () => toast.success("已送出審核"),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "發布失敗");
    },
  });

  useEffect(() => {
    setPlaytestPassed(false);
    setPlaytestSolution(null);
    setIsPlaytestOpen(false);
    setPlaytestPayload(null);
  }, [mapData, config]);

  const ensureMapWithinLimit = () => {
    if (sizeCheck.ok) return true;
    toast.error(
      `地圖尺寸過大 (${sizeCheck.width}x${sizeCheck.height})，上限為 ${MAX_RENDER_SIZE}x${MAX_RENDER_SIZE}`
    );
    return false;
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("請輸入關卡名稱");
      return;
    }
    if (!ensureMapWithinLimit()) return;
    const runtimeMap = compileMapData(mapData);
    if (mode === "designer" && !levelId) {
      createMutation.mutate({ title, map: runtimeMap, config });
      return;
    }
    if (!levelId) {
      toast.error("缺少關卡 ID");
      return;
    }
    if (mode === "admin") {
      adminUpdateMutation.mutate({ id: levelId, data: { title, map: runtimeMap, config } });
      return;
    }
    updateMutation.mutate({ id: levelId, data: { title, map: runtimeMap, config } });
  };

  const handlePublish = async () => {
    if (!levelId) {
      if (!title.trim()) {
        toast.error("請輸入關卡名稱");
        return;
      }
    }
    if (!ensureMapWithinLimit()) return;
    if (!playtestPassed) {
      toast.error("請先試玩通關");
      return;
    }
    if (!playtestSolution) {
      toast.error("尚未取得試玩解答");
      return;
    }
    const runtimeMap = compileMapData(mapData);
    try {
      let resolvedId = levelId;
      if (!resolvedId) {
        const created = await createLevel({ title, map: runtimeMap, config });
        resolvedId = created.id;
        router.replace(`/studio/editor/${created.id}`);
      } else {
        await updateLevel(resolvedId, { title, map: runtimeMap, config });
      }
      publishMutation.mutate({ id: resolvedId, data: { solution: playtestSolution } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "自動儲存失敗");
    }
  };

  const handlePlaytest = () => {
    if (!ensureMapWithinLimit()) return;
    const payload = { title, map: compileMapData(mapData), config };
    setPlaytestPayload(payload);
    setIsPlaytestOpen(true);
  };

  if (levelId && levelQuery.isLoading) {
    return <div className="px-4 py-10 text-sm text-ink-soft">載入關卡中…</div>;
  }

  if (levelId && levelQuery.isError) {
    return <div className="px-4 py-10 text-sm text-destructive">關卡載入失敗</div>;
  }

  return (
    <div className="px-4 pb-12 pt-6 sm:px-6">
      <div className="mx-auto max-w-[1320px] space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href={mode === "admin" ? "/admin/dashboard" : "/studio"} className="text-sm text-ink-soft hover:text-ink">
              ← {mode === "admin" ? "管理後台" : "創作工作室"}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-ink">{levelId ? "編輯關卡" : "新關卡"}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {mode === "designer"
                ? "畫好地圖後先自己試玩解開，才能送出審核。"
                : "管理員可以直接修改內容；修改地圖後關卡會回到草稿。"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                playtestPassed ? "bg-success/10 text-success" : "bg-paper-deep text-ink-soft"
              }`}
            >
              {playtestPassed ? "已解開" : "還沒解開"}
            </span>
            {!sizeCheck.ok && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                地圖太大
              </span>
            )}
            <Button variant="outline" onClick={handlePlaytest}>
              試玩
            </Button>
            <Button variant={mode === "designer" ? "outline" : "default"} onClick={handleSave}>
              {mode === "admin" ? "儲存關卡" : "儲存草稿"}
            </Button>
            {mode === "designer" && (
              <Button
                onClick={() => (playtestPassed ? handlePublish() : handlePlaytest())}
                title={playtestPassed ? "送出審核" : "先試玩解開這一關"}
              >
                {playtestPassed ? "送出審核" : "試玩後送出"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
          <EditorCanvas
            mapData={mapData}
            tool={tool}
            color={paintColor}
            onChange={setMapData}
          />
          <div className="flex flex-col gap-4">
            <EditorToolbar
              tool={tool}
              color={paintColor}
              onToolChange={setTool}
              onColorChange={setPaintColor}
            />
            <SettingsPanel
              title={title}
              config={config}
              padding={mapData.padding ?? DEFAULT_PADDING}
              contentBounds={contentBounds}
              renderBounds={compiledMap.bounds}
              onPaddingChange={(value) =>
                setMapData((current) => ({ ...current, padding: value }))
              }
              onTitleChange={setTitle}
              onConfigChange={setConfig}
            />
            <LevelJsonPanel
              mode={mode}
              levelId={levelId}
              title={title}
              mapData={mapData}
              config={config}
              fallbackConfig={DEFAULT_CONFIG}
              onImport={(payload) => {
                if (payload.title) {
                  setTitle(payload.title);
                }
                setMapData(payload.map);
                setConfig(payload.config);
              }}
            />
          </div>
        </div>
      </div>
      {playtestPayload && isPlaytestOpen && (
        <PlaytestModal
          title={playtestPayload.title}
          mapData={playtestPayload.map}
          config={playtestPayload.config}
          canPublish={mode === "designer" && playtestPassed && !!playtestSolution}
          playtestPassed={playtestPassed}
          publishHint={
            mode === "designer"
              ? "需要先在測試頁面完成過關才可以發佈"
              : "管理模式不提供發布功能"
          }
          onClose={() => {
            setIsPlaytestOpen(false);
            setPlaytestPayload(null);
          }}
          onPublish={mode === "designer" ? handlePublish : () => {}}
          onSuccess={(solution) => {
            setPlaytestPassed(true);
            setPlaytestSolution(solution);
          }}
        />
      )}
    </div>
  );
}
