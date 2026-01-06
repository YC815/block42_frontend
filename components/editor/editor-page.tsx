"use client";

/**
 * Block42 Frontend - Shared editor page logic
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    return <div className="p-6">載入關卡中...</div>;
  }

  if (levelId && levelQuery.isError) {
    return <div className="p-6 text-red-500">關卡載入失敗</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_45%),radial-gradient(circle_at_15%_20%,rgba(250,204,21,0.16),transparent_40%),linear-gradient(180deg,#f8fafc,#e2e8f0)] px-6 py-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 px-6 py-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Level Editor
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              關卡編輯器
            </h1>
            <p className="mt-1 text-sm text-slate-600">建立或修改關卡內容。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={handlePlaytest}
            >
              試玩驗證
            </button>
            <button
              className="h-10 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={handleSave}
            >
              {mode === "admin" ? "儲存關卡" : "儲存草稿"}
            </button>
            {mode === "designer" && (
              <div className="flex flex-col items-end gap-1">
                <button
                  className="h-10 rounded-full bg-teal-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400"
                  onClick={() => {
                    if (playtestPassed) {
                      handlePublish();
                    } else {
                      handlePlaytest();
                    }
                  }}
                >
                  測試過關並提交發布
                </button>
                <span className="min-h-[16px] text-xs text-slate-500">
                  {!playtestPassed ? "需要先在測試頁面完成過關才可以發佈" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 space-x-2">
            <span>
              編輯範圍：{contentBounds.width} x {contentBounds.height}
            </span>
            <span className="text-slate-400">
              x: {contentBounds.minX}~{contentBounds.maxX}, y: {contentBounds.minY}~{contentBounds.maxY}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className={sizeCheck.ok ? "" : "text-rose-600"}>
              渲染框（含空氣）：{compiledMap.bounds.width} x {compiledMap.bounds.height}
            </span>
            <span className="text-xs text-slate-500">
              試玩驗證：{playtestPassed ? "已通過" : "尚未通過"}
            </span>
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
