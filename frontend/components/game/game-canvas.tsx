/**
 * Block42 Frontend - Game Canvas
 * 畫出地圖、星星與機器人。機器人是獨立一層，移動與轉向用 CSS transition 補間。
 */

"use client";

import type { MapData, TileColor } from "@/types/api";
import type { GameState } from "@/lib/game-engine/types";
import { coordToKey } from "@/lib/game-engine/types";
import { computeRenderBounds } from "@/lib/map-utils";
import { useEffect, useRef, useState } from "react";
import { RobotIcon, StarIcon, TILE_COLORS } from "@/components/game/game-icons";

interface GameCanvasProps {
  mapData: MapData;
  state: GameState | null;
  cellSize?: number;
  fitToContainer?: boolean;
  /** 動畫每一步的毫秒數，用來同步機器人的補間時間 */
  stepDurationMs?: number;
}

const MIN_CELL_SIZE = 14;
const MAX_CELL_SIZE = 56;
const GAP_RATIO = 0.1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gapFor(cellSize: number) {
  return Math.max(2, Math.round(cellSize * GAP_RATIO));
}

function fitCellSize(available: number, count: number, max: number) {
  if (!Number.isFinite(available) || available <= 0) return max;
  for (let size = max; size >= MIN_CELL_SIZE; size -= 1) {
    if (count * size + (count - 1) * gapFor(size) <= available) return size;
  }
  return MIN_CELL_SIZE;
}

export function GameCanvas({
  mapData,
  state,
  cellSize,
  fitToContainer = false,
  stepDurationMs = 160,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!fitToContainer) return;
    const element = containerRef.current;
    if (!element) return;
    const update = () =>
      setContainerSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fitToContainer]);

  let bounds = computeRenderBounds(mapData);
  // 機器人掉出地圖時，把邊界撐開讓玩家看到它掉在哪
  const fallen = state?.outOfBoundsPosition;
  if (fallen) {
    const minX = Math.min(bounds.minX, fallen.x);
    const minY = Math.min(bounds.minY, fallen.y);
    const maxX = Math.max(bounds.maxX, fallen.x);
    const maxY = Math.max(bounds.maxY, fallen.y);
    bounds = { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }

  const columns = bounds.width;
  const rows = bounds.height;
  const maxCell = clamp(Math.round(cellSize ?? MAX_CELL_SIZE), MIN_CELL_SIZE, MAX_CELL_SIZE);
  const size = fitToContainer
    ? Math.min(
        fitCellSize(containerSize.width - 16, columns, maxCell),
        fitCellSize(containerSize.height - 16, rows, maxCell)
      )
    : maxCell;
  const gap = gapFor(size);
  const pitch = size + gap;

  const tileMap = new Map<string, TileColor>();
  mapData.tiles.forEach((tile) => tileMap.set(coordToKey(tile.x, tile.y), tile.color));
  const painted = state?.paintedTiles;
  const collected = state?.collectedStars;

  const position = state?.position ?? { x: mapData.start.x, y: mapData.start.y };
  const direction = state?.direction ?? mapData.start.dir;
  const failed = state?.status === "failure";

  // 方向用累計角度，避免從 270° 轉到 0° 時反向轉一大圈
  const [angle, setAngle] = useState(direction * 90);
  const [lastDirection, setLastDirection] = useState(direction);
  if (lastDirection !== direction) {
    const delta = (direction - lastDirection + 4) % 4;
    setLastDirection(direction);
    setAngle(angle + (delta === 3 ? -90 : delta * 90));
  }

  const robotX = (position.x - bounds.minX) * pitch;
  const robotY = (position.y - bounds.minY) * pitch;
  const tween = `${Math.max(60, Math.min(220, stepDurationMs * 0.9))}ms`;

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
      data-tour-id="game-canvas"
    >
      <div
        className="relative"
        style={{ width: columns * pitch - gap, height: rows * pitch - gap }}
        role="img"
        aria-label={`地圖：${mapData.tiles.length} 格地板、${mapData.stars.length} 顆星星`}
      >
        {mapData.tiles.map((tile) => {
          const key = coordToKey(tile.x, tile.y);
          const color = painted?.get(key) ?? tile.color;
          const palette = TILE_COLORS[color];
          return (
            <div
              key={key}
              className="absolute rounded-[22%] transition-colors duration-200"
              style={{
                left: (tile.x - bounds.minX) * pitch,
                top: (tile.y - bounds.minY) * pitch,
                width: size,
                height: size,
                background: palette.fill,
                boxShadow: `inset 0 -${Math.max(2, Math.round(size * 0.08))}px 0 ${palette.deep}`,
              }}
            />
          );
        })}

        {mapData.stars.map((star) => {
          const key = coordToKey(star.x, star.y);
          const isCollected = collected?.has(key);
          return (
            <div
              key={`star-${key}`}
              className="absolute flex items-center justify-center"
              style={{
                left: (star.x - bounds.minX) * pitch,
                top: (star.y - bounds.minY) * pitch,
                width: size,
                height: size,
              }}
            >
              <StarIcon
                className={`h-[62%] w-[62%] drop-shadow-sm ${isCollected ? "animate-star-pop opacity-40" : ""}`}
              />
            </div>
          );
        })}

        {fallen && (
          <div
            className="absolute rounded-[22%] border-2 border-dashed border-destructive/70"
            style={{
              left: (fallen.x - bounds.minX) * pitch,
              top: (fallen.y - bounds.minY) * pitch,
              width: size,
              height: size,
            }}
          />
        )}

        <div
          className="absolute left-0 top-0 flex items-center justify-center"
          style={{
            width: size,
            height: size,
            transform: `translate(${robotX}px, ${robotY}px)`,
            transition: `transform ${tween} ease-in-out`,
          }}
        >
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ rotate: `${angle}deg`, transition: `rotate ${tween} ease-in-out` }}
          >
            <RobotIcon
              failed={failed}
              className={`h-[78%] w-[78%] drop-shadow ${failed ? "animate-robot-bump" : ""}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
