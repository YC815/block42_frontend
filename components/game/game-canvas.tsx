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
      return "bg-rose-600";
    case "G":
      return "bg-emerald-600";
    case "B":
      return "bg-sky-600";
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

  // 計算基礎邊界
  let bounds = computeRenderBounds(mapData);

  // 如果有越界位置，擴大邊界以容納它
  if (state?.outOfBoundsPosition) {
    const { x, y } = state.outOfBoundsPosition;
    bounds = {
      minX: Math.min(bounds.minX, x),
      minY: Math.min(bounds.minY, y),
      maxX: Math.max(bounds.maxX, x),
      maxY: Math.max(bounds.maxY, y),
      width: Math.max(bounds.maxX, x) - Math.min(bounds.minX, x) + 1,
      height: Math.max(bounds.maxY, y) - Math.min(bounds.minY, y) + 1,
    };
  }

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
    <div className="relative h-full w-full" data-tour-id="game-canvas">
      <div className="absolute inset-0 rounded-[28px] bg-slate-100" />
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
              const isOutOfBounds = Boolean(
                state?.outOfBoundsPosition &&
                state.outOfBoundsPosition.x === x &&
                state.outOfBoundsPosition.y === y
              );

              return (
                <div
                  key={key}
                  className={`relative rounded-[10px] border border-slate-900/10 ${
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
                        className={`flex items-center justify-center ${
                          isOutOfBounds
                            ? "text-red-600 opacity-60"
                            : "text-white"
                        } ${directionRotation(rocketDir)}`}
                        style={{ fontSize: tokenSize }}
                      >
                        ▲
                      </div>
                      {isOutOfBounds && (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-red-600"
                          style={{ fontSize: Math.round(tokenSize * 1.3) }}
                        >
                          ⚠
                        </div>
                      )}
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
