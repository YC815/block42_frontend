"use client";

/**
 * Block42 Frontend - Shared editor page logic
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { LevelConfig, MapData, Solution } from "@/types/api";
import { getLevelById } from "@/lib/api/levels";
import { createLevel, updateLevel, publishLevel } from "@/lib/api/designer";
import { toast } from "sonner";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { SettingsPanel } from "@/components/editor/settings-panel";

const DEFAULT_MAP: MapData = {
  gridSize: 10,
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

const GRID_MIN = 4;
const GRID_MAX = 16;

function clampGridSize(value: number) {
  if (!Number.isFinite(value)) {
    return GRID_MIN;
  }
  return Math.min(GRID_MAX, Math.max(GRID_MIN, value));
}

function normalizeMapData(mapData: MapData, nextGridSize: number): MapData {
  const maxIndex = nextGridSize - 1;
  const tiles = mapData.tiles.filter(
    (tile) => tile.x <= maxIndex && tile.y <= maxIndex
  );
  const stars = mapData.stars.filter(
    (star) => star.x <= maxIndex && star.y <= maxIndex
  );
  let start = mapData.start;

  if (start.x > maxIndex || start.y > maxIndex) {
    start = { ...start, x: 0, y: 0 };
  }

  let nextTiles = tiles;
  const hasStartTile = nextTiles.some(
    (tile) => tile.x === start.x && tile.y === start.y
  );
  if (!hasStartTile) {
    nextTiles = [...nextTiles, { x: start.x, y: start.y, color: "R" }];
  }

  return {
    ...mapData,
    gridSize: nextGridSize,
    tiles: nextTiles,
    stars,
    start,
  };
}

interface EditorPageProps {
  levelId?: string;
}

export function EditorPage({ levelId }: EditorPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("未命名關卡");
  const [mapData, setMapData] = useState<MapData>(DEFAULT_MAP);
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [tool, setTool] = useState<"paint" | "erase" | "start" | "star">("paint");
  const [paintColor, setPaintColor] = useState<"R" | "G" | "B">("R");
  const [playtestPassed, setPlaytestPassed] = useState(false);
  const [playtestSolution, setPlaytestSolution] = useState<Solution | null>(null);
  const [activePreviewKey, setActivePreviewKey] = useState<string | null>(null);

  const PREVIEW_STORAGE_PREFIX = "block42:play-preview:";

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId as string),
    enabled: !!levelId,
  });

  useEffect(() => {
    if (levelQuery.data) {
      const incomingMap = levelQuery.data.map;
      const resolvedGridSize = clampGridSize(
        incomingMap.gridSize ?? DEFAULT_MAP.gridSize
      );
      setTitle(levelQuery.data.title);
      setMapData(
        normalizeMapData(
          { ...incomingMap, gridSize: resolvedGridSize },
          resolvedGridSize
        )
      );
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
    setActivePreviewKey(null);
  }, [mapData, config]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; key?: string; solution?: Solution };
      if (data?.type !== "playtest-success") return;
      if (!activePreviewKey || data.key !== activePreviewKey) return;
      setPlaytestPassed(true);
      if (data.solution) {
        setPlaytestSolution(data.solution);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activePreviewKey]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("請輸入關卡名稱");
      return;
    }
    if (!levelId) {
      createMutation.mutate({ title, map: mapData, config });
      return;
    }
    updateMutation.mutate({ id: levelId, data: { title, map: mapData, config } });
  };

  const handlePublish = () => {
    if (!levelId) {
      toast.error("請先儲存關卡");
      return;
    }
    if (!playtestPassed) {
      toast.error("請先試玩通關");
      return;
    }
    if (!playtestSolution) {
      toast.error("尚未取得試玩解答");
      return;
    }
    publishMutation.mutate({ id: levelId, data: { solution: playtestSolution } });
  };

  const handlePlaytest = () => {
    const previewKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { title, map: mapData, config };
    localStorage.setItem(`${PREVIEW_STORAGE_PREFIX}${previewKey}`, JSON.stringify(payload));
    setActivePreviewKey(previewKey);
    window.open(`/studio/play-preview?key=${previewKey}`, "_blank");
  };

  const handleGridSizeChange = (value: number) => {
    const nextSize = clampGridSize(value);
    setMapData((current) => normalizeMapData(current, nextSize));
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
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={handlePlaytest}
            >
              試玩驗證
            </button>
            <button
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              onClick={handleSave}
            >
              儲存草稿
            </button>
            <button
              className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 disabled:opacity-50"
              onClick={handlePublish}
              disabled={!playtestPassed}
            >
              提交發布
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            目前棋盤：{mapData.gridSize} x {mapData.gridSize}
          </div>
          <div className="text-xs text-slate-500">
            試玩驗證：{playtestPassed ? "已通過" : "尚未通過"}
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
              gridSize={mapData.gridSize}
              onGridSizeChange={handleGridSizeChange}
              onTitleChange={setTitle}
              onConfigChange={setConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
