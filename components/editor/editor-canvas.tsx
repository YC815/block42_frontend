/**
 * Block42 Frontend - Editor canvas
 * Allows map editing with simple grid interactions.
 */

"use client";

import type { MapData, TileColor } from "@/types/api";
import { coordToKey } from "@/lib/game-engine/types";
import type { EditorTool } from "@/components/editor/editor-toolbar";
import { useEffect, useRef, useState } from "react";

interface EditorCanvasProps {
  mapData: MapData;
  tool: EditorTool;
  color: TileColor;
  onChange: (mapData: MapData) => void;
}

const DEFAULT_GRID_SIZE = 10;
const MIN_CELL_SIZE = 18;
const MAX_CELL_SIZE = 52;
const GAP_RATIO = 0.12;

function getGridPixelSize(gridSize: number, cellSize: number) {
  const gap = Math.max(2, Math.round(cellSize * GAP_RATIO));
  return gridSize * cellSize + (gridSize - 1) * gap;
}

function getFittedCellSize(
  availableSize: number,
  gridSize: number,
  minCellSize: number,
  maxCellSize: number
) {
  if (!Number.isFinite(availableSize) || availableSize <= 0) {
    return maxCellSize;
  }
  for (let size = maxCellSize; size >= minCellSize; size -= 1) {
    if (getGridPixelSize(gridSize, size) <= availableSize) {
      return size;
    }
  }
  return minCellSize;
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
  const gridSize = Math.max(4, Math.min(mapData.gridSize ?? DEFAULT_GRID_SIZE, 16));
  const fallbackCellSize = gridSize >= 14 ? 24 : 28;
  const availableSize = Math.min(containerSize.width, containerSize.height);
  const cellSize =
    availableSize > 0
      ? getFittedCellSize(availableSize, gridSize, MIN_CELL_SIZE, MAX_CELL_SIZE)
      : fallbackCellSize;
  const gridGap = Math.max(2, Math.round(cellSize * 0.12));
  const tokenSize = Math.max(12, Math.round(cellSize * 0.58));
  const tiles = new Map<string, TileColor>();
  mapData.tiles.forEach((tile) => tiles.set(coordToKey(tile.x, tile.y), tile.color));

  const stars = new Set(mapData.stars.map((star) => coordToKey(star.x, star.y)));

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

  const handleCellClick = (x: number, y: number) => {
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

      const nextTiles = tiles.has(key)
        ? mapData.tiles
        : [...mapData.tiles, { x, y, color: "R" }];
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
      const nextTiles = tiles.has(key)
        ? mapData.tiles
        : [...mapData.tiles, { x, y, color: "R" }];
      onChange({ ...mapData, tiles: nextTiles, stars: nextStars });
    }
  };

  return (
    <div className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[28px] border border-slate-900/10 bg-slate-950/90 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.9)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(2,6,23,0.95))]" />
      <div className="relative flex flex-1 items-center justify-center overflow-auto p-4">
        <div ref={containerRef} className="flex h-full w-full items-center justify-center">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
              gap: `${gridGap}px`,
            }}
          >
            {Array.from({ length: gridSize }).map((_, y) =>
              Array.from({ length: gridSize }).map((_, x) => {
                const key = coordToKey(x, y);
                const tileColor = tiles.get(key);
                const hasStar = stars.has(key);
                const isStart = mapData.start.x === x && mapData.start.y === y;

                const cellColor = tileColor
                  ? tileColorClass(tileColor)
                  : "bg-slate-900/70";

                return (
                  <button
                    key={key}
                    type="button"
                    className={`relative flex items-center justify-center rounded-[10px] border border-white/10 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.8)] transition hover:border-white/30 ${cellColor}`}
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
              })
            )}
          </div>
        </div>
      </div>
      <p className="relative mt-3 text-xs text-slate-200/80">
        點擊格子進行編輯，起點再次點擊可旋轉方向。
      </p>
    </div>
  );
}
