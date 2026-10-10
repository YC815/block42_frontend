"use client";

import { useRef } from "react";
import type { ChangeEvent } from "react";
import { toast } from "sonner";
import type { LevelConfig, MapBounds, MapData, TileColor } from "@/types/api";
import { DEFAULT_PADDING, ensureStartFloor } from "@/lib/map-utils";

const LEVEL_JSON_VERSION = 1;

interface LevelJsonPanelProps {
  mode: "designer" | "admin";
  levelId?: string;
  title: string;
  mapData: MapData;
  config: LevelConfig;
  fallbackConfig: LevelConfig;
  onImport: (payload: { title?: string; map: MapData; config: LevelConfig }) => void;
}

interface LevelJsonPayload {
  version: number;
  title?: string;
  map: MapData;
  config: LevelConfig;
  meta?: {
    exported_at: string;
    source: "designer" | "admin";
    level_id?: string | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value)
    ? value
    : null;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isTileColor(value: unknown): value is TileColor {
  return value === "R" || value === "G" || value === "B";
}

function parseBounds(value: unknown): MapBounds | null {
  if (!isRecord(value)) return null;
  const minX = toInteger(value.minX);
  const minY = toInteger(value.minY);
  const maxX = toInteger(value.maxX);
  const maxY = toInteger(value.maxY);
  if (minX === null || minY === null || maxX === null || maxY === null) return null;
  return { minX, minY, maxX, maxY };
}

function parseMapData(value: unknown): MapData | null {
  if (!isRecord(value)) return null;
  const startRaw = value.start;
  if (!isRecord(startRaw)) return null;

  const startX = toInteger(startRaw.x);
  const startY = toInteger(startRaw.y);
  if (startX === null || startY === null) return null;

  const dirRaw = toInteger(startRaw.dir);
  const dir = dirRaw !== null && [0, 1, 2, 3].includes(dirRaw)
    ? (dirRaw as 0 | 1 | 2 | 3)
    : (1 as 0 | 1 | 2 | 3);

  const tilesRaw = value.tiles;
  if (tilesRaw !== undefined && !Array.isArray(tilesRaw)) return null;
  const tiles: MapData["tiles"] = [];
  for (const entry of Array.isArray(tilesRaw) ? tilesRaw : []) {
    if (!isRecord(entry)) return null;
    const x = toInteger(entry.x);
    const y = toInteger(entry.y);
    const color = entry.color;
    if (x === null || y === null || !isTileColor(color)) return null;
    tiles.push({ x, y, color });
  }

  const starsRaw = value.stars;
  if (starsRaw !== undefined && !Array.isArray(starsRaw)) return null;
  const stars: MapData["stars"] = [];
  for (const entry of Array.isArray(starsRaw) ? starsRaw : []) {
    if (!isRecord(entry)) return null;
    const x = toInteger(entry.x);
    const y = toInteger(entry.y);
    if (x === null || y === null) return null;
    stars.push({ x, y });
  }

  const padding = toInteger(value.padding);
  const gridSize = toInteger(value.gridSize);
  const bounds = parseBounds(value.bounds);

  const mapData: MapData = {
    start: { x: startX, y: startY, dir },
    tiles,
    stars,
  };

  if (padding !== null) mapData.padding = padding;
  if (gridSize !== null) mapData.gridSize = gridSize;
  if (bounds) mapData.bounds = bounds;

  return mapData;
}

function clampSlot(value: number): number {
  return Math.min(20, Math.max(0, value));
}

function parseConfig(value: unknown, fallback: LevelConfig): LevelConfig | null {
  if (!isRecord(value)) return null;
  const f0 = toInteger(value.f0);
  const f1 = toInteger(value.f1);
  const f2 = toInteger(value.f2);
  if (f0 === null || f1 === null || f2 === null) return null;

  const toolsRaw = isRecord(value.tools) ? value.tools : {};
  const tools = {
    paint_red: toBoolean(toolsRaw.paint_red, fallback.tools.paint_red),
    paint_green: toBoolean(toolsRaw.paint_green, fallback.tools.paint_green),
    paint_blue: toBoolean(toolsRaw.paint_blue, fallback.tools.paint_blue),
  };

  return {
    f0: clampSlot(f0),
    f1: clampSlot(f1),
    f2: clampSlot(f2),
    tools,
  };
}

function normalizeMapData(mapData: MapData): MapData {
  return ensureStartFloor({
    ...mapData,
    tiles: mapData.tiles ?? [],
    stars: mapData.stars ?? [],
    padding: mapData.padding ?? DEFAULT_PADDING,
  });
}

function extractPayload(value: unknown, fallbackConfig: LevelConfig) {
  if (!isRecord(value)) return null;
  const container = isRecord(value.level) ? value.level : value;

  const mapValue = container.map ?? container.map_data ?? container.mapData;
  const configValue = container.config ?? container.level_config ?? container.levelConfig;
  if (!mapValue || !configValue) return null;

  const map = parseMapData(mapValue);
  if (!map) return null;

  const config = parseConfig(configValue, fallbackConfig);
  if (!config) return null;

  const title = typeof container.title === "string" ? container.title : undefined;

  return { title, map, config };
}

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildFilename(levelId?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const suffix = levelId ? levelId : "draft";
  return `level-${suffix}-${date}.json`;
}

export function LevelJsonPanel({
  mode,
  levelId,
  title,
  mapData,
  config,
  fallbackConfig,
  onImport,
}: LevelJsonPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    const payload: LevelJsonPayload = {
      version: LEVEL_JSON_VERSION,
      title: title.trim() || "未命名關卡",
      map: normalizeMapData(mapData),
      config,
      meta: {
        exported_at: new Date().toISOString(),
        source: mode,
        level_id: levelId ?? null,
      },
    };

    downloadJson(buildFilename(levelId), JSON.stringify(payload, null, 2));
    toast.success("已匯出 JSON");
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const payload = extractPayload(raw, fallbackConfig);

      if (!payload) {
        toast.error("JSON 格式不符合，請確認含有 map 與 config");
        return;
      }

      onImport({
        title: payload.title,
        map: normalizeMapData(payload.map),
        config: payload.config,
      });
      toast.success("已匯入 JSON");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "讀取 JSON 失敗");
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_45px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          JSON 工具
        </div>
        <p className="mt-2 text-sm text-slate-600">
          匯出備份或匯入 JSON，快速複製關卡配置與地圖內容。
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="h-9 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={handleExport}
        >
          匯出 JSON
        </button>
        <button
          type="button"
          className="h-9 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          onClick={() => fileInputRef.current?.click()}
        >
          匯入 JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
        <div className="font-semibold text-slate-700">檔案內容</div>
        <p className="mt-1">包含 title / map / config，匯入會覆蓋目前編輯內容。</p>
      </div>
    </div>
  );
}
