/**
 * Block42 Frontend - Game Canvas
 * Renders the map grid, stars, and rocket.
 */

"use client";

import type { MapData, TileColor } from "@/types/api";
import type { GameState } from "@/lib/game-engine/types";
import { coordToKey } from "@/lib/game-engine/types";
import { computeRenderBounds } from "@/lib/map-utils";
import { useEffect, useRef, useState } from "react";

interface GameCanvasProps {
  mapData: MapData;
  state: GameState | null;
  cellSize?: number;
  fitToContainer?: boolean;
}

const MIN_CELL_SIZE = 18;
const MAX_CELL_SIZE = 52;
const GAP_RATIO = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

export function GameCanvas({
  mapData,
  state,
  cellSize,
  fitToContainer = false,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const bounds = computeRenderBounds(mapData);
  const columns = bounds.width;
  const rows = bounds.height;

  useEffect(() => {
    if (!fitToContainer) return;
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
  }, [fitToContainer]);

  const maxCellSize = clamp(
    Math.round(cellSize ?? MAX_CELL_SIZE),
    MIN_CELL_SIZE,
    MAX_CELL_SIZE
  );
  const fallbackCellSize = clamp(
    Math.round(cellSize ?? 28),
    MIN_CELL_SIZE,
    MAX_CELL_SIZE
  );
  const availableWidth = containerSize.width;
  const availableHeight = containerSize.height;
  const resolvedCellSize = fitToContainer
    ? Math.min(
        getFittedCellSize(
          availableWidth,
          columns,
          MIN_CELL_SIZE,
          maxCellSize
        ),
        getFittedCellSize(
          availableHeight,
          rows,
          MIN_CELL_SIZE,
          maxCellSize
        )
      )
    : fallbackCellSize;
  const gridGap = Math.max(2, Math.round(resolvedCellSize * GAP_RATIO));
  const tileMap = new Map<string, TileColor>();
  mapData.tiles.forEach((tile) => {
    tileMap.set(coordToKey(tile.x, tile.y), tile.color);
  });
  const starSet = new Set(mapData.stars.map((star) => coordToKey(star.x, star.y)));

  const paintedTiles = state?.paintedTiles ?? new Map<string, TileColor>();
  const collected = state?.collectedStars ?? new Set<string>();

  const cells = [] as Array<{ x: number; y: number; key: string }>; // y-major
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      cells.push({ x, y, key: coordToKey(x, y) });
    }
  }

  const rocketPos = state?.position;
  const rocketDir = state?.direction ?? mapData.start.dir;
  const tokenSize = Math.max(12, Math.round(resolvedCellSize * 0.58));

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-[28px] bg-linear-to-br from-slate-100 via-slate-50 to-white" />
      <div className="relative h-full w-full p-6">
        <div
          ref={containerRef}
          className="flex h-full w-full items-center justify-center"
        >
          <div
            className="mx-auto grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, ${resolvedCellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${resolvedCellSize}px)`,
              gap: `${gridGap}px`,
            }}
          >
            {cells.map(({ x, y, key }) => {
              const painted = paintedTiles.get(key);
              const baseTile = tileMap.get(key);
              const color = painted || baseTile;
              const hasStar = starSet.has(key);
              const isCollected = collected.has(key);
              const isRocket = rocketPos?.x === x && rocketPos?.y === y;

              return (
                <div
                  key={key}
                  className={`relative rounded-[10px] border border-slate-900/10 shadow-sm ${
                    color ? tileColorClass(color) : "bg-slate-200/50"
                  }`}
                >
                  {hasStar && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition ${
                        isCollected ? "opacity-30" : "opacity-100"
                      }`}
                      style={{ fontSize: Math.round(resolvedCellSize * 0.58) }}
                    >
                      ⭐
                    </div>
                  )}
                  {isRocket && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`flex items-center justify-center text-white ${directionRotation(
                          rocketDir
                        )}`}
                        style={{ fontSize: tokenSize }}
                      >
                        ▲
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
