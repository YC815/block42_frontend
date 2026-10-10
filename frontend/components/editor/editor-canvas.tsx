/**
 * Block42 Frontend - Editor canvas
 * Modernized workspace: infinite grid with pan/zoom and dynamic bounds.
 */

"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import type { MapData, TileColor } from "@/types/api";
import { coordToKey } from "@/lib/game-engine/types";
import type { EditorTool } from "@/components/editor/editor-toolbar";
import { computeContentBounds, MAX_GRID_SIZE } from "@/lib/map-utils";
import { useEffect, useMemo, useRef, useState } from "react";

interface EditorCanvasProps {
  mapData: MapData;
  tool: EditorTool;
  color: TileColor;
  onChange: (mapData: MapData) => void;
}

const BASE_CELL_SIZE = 42;
const MIN_CELL_SIZE = 18;
const MAX_CELL_SIZE = 56;
const GAP_RATIO = 0.12;
const MIN_ZOOM = 0.65;
const MAX_ZOOM = 2.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tileColorClass(color: TileColor) {
  switch (color) {
    case "R":
      return "bg-gradient-to-br from-rose-500/95 via-rose-500/80 to-rose-300/70";
    case "G":
      return "bg-gradient-to-br from-emerald-500/95 via-emerald-500/80 to-emerald-300/70";
    case "B":
      return "bg-gradient-to-br from-sky-500/95 via-sky-500/80 to-sky-300/70";
    default:
      return "bg-slate-500";
  }
}

function directionRotation(dir: number) {
  switch (dir) {
    case 0:
      return "rotate-0";
    case 1:
      return "rotate-90";
    case 2:
      return "rotate-180";
    case 3:
      return "-rotate-90";
    default:
      return "rotate-0";
  }
}

export function EditorCanvas({ mapData, tool, color, onChange }: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [handMode, setHandMode] = useState(false);
  const [camera, setCamera] = useState({ x: mapData.start.x, y: mapData.start.y });
  const [isPanning, setIsPanning] = useState(false);
  const panOrigin = useRef<{ x: number; y: number; camera: { x: number; y: number } } | null>(
    null
  );
  const skipClickRef = useRef(false);

  const tileMap = useMemo(() => {
    const tiles = new Map<string, TileColor>();
    mapData.tiles?.forEach((tile) => tiles.set(coordToKey(tile.x, tile.y), tile.color));
    return tiles;
  }, [mapData.tiles]);
  const stars = useMemo(
    () => new Set(mapData.stars?.map((star) => coordToKey(star.x, star.y)) ?? []),
    [mapData.stars]
  );

  const contentBounds = useMemo(() => computeContentBounds(mapData), [mapData]);
  const contentCenter = useMemo(
    () => ({
      x: (contentBounds.minX + contentBounds.maxX) / 2,
      y: (contentBounds.minY + contentBounds.maxY) / 2,
    }),
    [contentBounds]
  );

  const cellSize = clamp(BASE_CELL_SIZE * zoom, MIN_CELL_SIZE, MAX_CELL_SIZE);
  const gridGap = Math.max(2, Math.round(cellSize * GAP_RATIO));
  const step = cellSize + gridGap;
  const tokenSize = Math.max(12, Math.round(cellSize * 0.58));

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCamera({ x: mapData.start.x, y: mapData.start.y });
  }, [mapData.start.x, mapData.start.y]);

  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (event: MouseEvent) => {
      if (!panOrigin.current) return;
      const dx = (event.clientX - panOrigin.current.x) / step;
      const dy = (event.clientY - panOrigin.current.y) / step;
      const halfLimit = Math.floor(MAX_GRID_SIZE / 2);
      setCamera({
        x: clamp(panOrigin.current.camera.x - dx, -halfLimit, halfLimit - 1),
        y: clamp(panOrigin.current.camera.y - dy, -halfLimit, halfLimit - 1),
      });
    };
    const endPan = () => setIsPanning(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", endPan);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", endPan);
    };
  }, [isPanning, step]);

  const handleCellClick = (x: number, y: number) => {
    if (skipClickRef.current) {
      skipClickRef.current = false;
      return;
    }
    if (isPanning || handMode) return;

    const halfLimit = Math.floor(MAX_GRID_SIZE / 2);
    if (Math.abs(x) >= halfLimit || Math.abs(y) >= halfLimit) {
      return;
    }

    const key = coordToKey(x, y);

    if (tool === "paint") {
      const nextTiles = mapData.tiles.filter((tile) => coordToKey(tile.x, tile.y) !== key);
      nextTiles.push({ x, y, color });
      onChange({ ...mapData, tiles: nextTiles });
      return;
    }

    if (tool === "erase") {
      const nextTiles = mapData.tiles.filter((tile) => coordToKey(tile.x, tile.y) !== key);
      const nextStars = mapData.stars.filter((star) => coordToKey(star.x, star.y) !== key);
      let nextStart = mapData.start;
      let updatedTiles = nextTiles;

      if (mapData.start.x === x && mapData.start.y === y) {
        nextStart = { ...mapData.start, x: 0, y: 0 };
        const startKey = coordToKey(nextStart.x, nextStart.y);
        if (!updatedTiles.some((tile) => coordToKey(tile.x, tile.y) === startKey)) {
          updatedTiles = [...updatedTiles, { x: nextStart.x, y: nextStart.y, color: "R" }];
        }
      }

      onChange({ ...mapData, tiles: updatedTiles, stars: nextStars, start: nextStart });
      return;
    }

    if (tool === "start") {
      const isSame = mapData.start.x === x && mapData.start.y === y;
      if (isSame) {
        onChange({
          ...mapData,
          start: { ...mapData.start, dir: ((mapData.start.dir + 1) % 4) as 0 | 1 | 2 | 3 },
        });
        return;
      }

      const nextTiles = tileMap.has(key)
        ? mapData.tiles
        : [...mapData.tiles, { x, y, color: "R" as TileColor }];
      onChange({
        ...mapData,
        tiles: nextTiles,
        start: { x, y, dir: mapData.start.dir },
      });
      return;
    }

    if (tool === "star") {
      const hasStar = stars.has(key);
      const nextStars = hasStar
        ? mapData.stars.filter((star) => coordToKey(star.x, star.y) !== key)
        : [...mapData.stars, { x, y }];
      const nextTiles = tileMap.has(key)
        ? mapData.tiles
        : [...mapData.tiles, { x, y, color: "R" as TileColor }];
      onChange({ ...mapData, tiles: nextTiles, stars: nextStars });
    }
  };

  return (
    <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[28px] border border-slate-900/10 bg-slate-950/90 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.9)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))]" />

      <div className="absolute left-5 top-4 z-20 flex flex-wrap items-center gap-3 rounded-full border border-white/15 bg-white/80 px-4 py-2 text-xs text-slate-700 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="tracking-[0.18em] text-[11px] uppercase text-slate-500">
            Zoom
          </span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-28 accent-slate-900"
          />
          <span className="w-12 text-right font-semibold">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
            onClick={() => setZoom(1)}
          >
            重設縮放
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => setCamera(contentCenter)}
          >
            對齊內容
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => setCamera({ x: mapData.start.x, y: mapData.start.y })}
          >
            回到起點
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm transition ${
              handMode
                ? "bg-amber-500 text-white hover:bg-amber-400"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setHandMode((prev) => !prev)}
          >
            拖曳視角
          </button>
        </div>
      </div>

      <div
        className="relative z-10 flex flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-slate-950/60"
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.08 : 0.08;
            setZoom((current) => clamp(current + delta, MIN_ZOOM, MAX_ZOOM));
            return;
          }
          const halfLimit = Math.floor(MAX_GRID_SIZE / 2);
          setCamera((current) => ({
            x: clamp(current.x + event.deltaX / step, -halfLimit, halfLimit - 1),
            y: clamp(current.y + event.deltaY / step, -halfLimit, halfLimit - 1),
          }));
        }}
        onMouseDown={(event) => {
          const shouldPan = handMode || event.button === 1 || event.button === 2 || event.altKey;
          if (shouldPan) {
            event.preventDefault();
            skipClickRef.current = true;
            panOrigin.current = {
              x: event.clientX,
              y: event.clientY,
              camera,
            };
            setIsPanning(true);
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div ref={containerRef} className="relative h-full w-full">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0) 35%)",
            }}
          />
          <div className="absolute inset-0">
            {(() => {
              const horizontalCells = Math.ceil((containerSize.width || 0) / step) + 6;
              const verticalCells = Math.ceil((containerSize.height || 0) / step) + 6;
              const halfLimit = Math.floor(MAX_GRID_SIZE / 2);
              const startX = Math.max(-halfLimit, Math.floor(camera.x - horizontalCells / 2));
              const endX = Math.min(halfLimit - 1, Math.floor(camera.x + horizontalCells / 2));
              const startY = Math.max(-halfLimit, Math.floor(camera.y - verticalCells / 2));
              const endY = Math.min(halfLimit - 1, Math.floor(camera.y + verticalCells / 2));

              const cells = [] as Array<{ x: number; y: number; key: string }>;
              for (let y = startY; y <= endY; y += 1) {
                for (let x = startX; x <= endX; x += 1) {
                  cells.push({ x, y, key: coordToKey(x, y) });
                }
              }

              const rectTopLeftX =
                (contentBounds.minX - camera.x) * step + containerSize.width / 2 - cellSize / 2;
              const rectTopLeftY =
                (contentBounds.minY - camera.y) * step + containerSize.height / 2 - cellSize / 2;
              const rectWidth = (contentBounds.width - 1) * step + cellSize;
              const rectHeight = (contentBounds.height - 1) * step + cellSize;

              return (
                <>
                  <div
                    className="absolute rounded-[14px] border border-emerald-300/40 bg-emerald-200/5"
                    style={{
                      left: rectTopLeftX,
                      top: rectTopLeftY,
                      width: rectWidth,
                      height: rectHeight,
                    }}
                  />
                  <div className="absolute left-1/2 top-1/2 h-full w-[1px] -translate-x-1/2 bg-white/5" />
                  <div className="absolute left-0 top-1/2 h-[1px] w-full -translate-y-1/2 bg-white/5" />
                  {cells.map(({ x, y, key }) => {
                    const tileColor = tileMap.get(key);
                    const hasStar = stars.has(key);
                    const isStart = mapData.start.x === x && mapData.start.y === y;
                    const cellColor = tileColor
                      ? tileColorClass(tileColor)
                      : "bg-slate-900/70";

                    const left =
                      containerSize.width / 2 + (x - camera.x) * step - cellSize / 2;
                    const top =
                      containerSize.height / 2 + (y - camera.y) * step - cellSize / 2;

                    return (
                      <button
                        key={key}
                        type="button"
                        className={`absolute flex items-center justify-center rounded-[10px] border border-white/10 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.8)] transition hover:border-white/30 ${cellColor}`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          transform: `translate(${left}px, ${top}px)`,
                        }}
                        onClick={() => handleCellClick(x, y)}
                      >
                        {hasStar && (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ fontSize: tokenSize }}
                          >
                            ⭐
                          </span>
                        )}
                        {isStart && (
                          <span
                            className={`absolute inset-0 flex items-center justify-center text-white ${directionRotation(
                              mapData.start.dir
                            )}`}
                            style={{ fontSize: tokenSize }}
                          >
                            ▲
                          </span>
                        )}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <p className="relative mt-3 text-xs text-slate-200/80">
        左鍵編輯，Alt/右鍵或拖曳模式可平移，Ctrl/⌘ + 滑鼠滾輪可縮放，起點再次點擊可旋轉方向。
      </p>
    </div>
  );
}
