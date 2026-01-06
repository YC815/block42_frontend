/**
 * Map utilities for editor/runtime normalization.
 * - Compute bounds from raw coordinates (supports negative coords while editing)
 * - Normalize to runtime-ready payload with padding & gridSize
 */

import { coordToKey } from "@/lib/game-engine/types";
import type { MapBounds, MapData, TileColor } from "@/types/api";

export const DEFAULT_PADDING = 1;
export const MAX_RENDER_SIZE = 128;
export const MAX_PADDING = 8;

export interface BoundsWithSize extends MapBounds {
  width: number;
  height: number;
}

function keyFor(x: number, y: number) {
  return `${x},${y}`;
}

function normalizeBounds(bounds: MapBounds): BoundsWithSize {
  return {
    ...bounds,
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1,
  };
}

export function computeContentBounds(mapData: MapData): BoundsWithSize {
  const points = [
    mapData.start,
    ...(mapData.tiles ?? []),
    ...(mapData.stars ?? []),
  ].map((point) => ({ x: point.x, y: point.y }));

  if (points.length === 0) {
    return normalizeBounds({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  }

  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));

  return normalizeBounds({ minX, minY, maxX, maxY });
}

export function computeRenderBounds(mapData: MapData): BoundsWithSize {
  if (mapData.bounds) {
    return normalizeBounds(mapData.bounds);
  }

  const padding = mapData.padding ?? DEFAULT_PADDING;
  const content = computeContentBounds(mapData);
  const width = content.width + padding * 2;
  const height = content.height + padding * 2;

  return normalizeBounds({
    minX: 0,
    minY: 0,
    maxX: width - 1,
    maxY: height - 1,
  });
}

function dedupeTiles(
  tiles: MapData["tiles"],
  shiftX: number,
  shiftY: number
): MapData["tiles"] {
  const tileMap = new Map<string, TileColor>();
  tiles.forEach((tile) => {
    tileMap.set(keyFor(tile.x + shiftX, tile.y + shiftY), tile.color);
  });

  return Array.from(tileMap.entries()).map(([key, color]) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y, color };
  });
}

function dedupeStars(
  stars: MapData["stars"],
  shiftX: number,
  shiftY: number
): MapData["stars"] {
  const seen = new Set<string>();
  stars.forEach((star) => {
    seen.add(keyFor(star.x + shiftX, star.y + shiftY));
  });

  return Array.from(seen.values()).map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
}

export interface CompiledMapData extends MapData {
  gridSize: number;
  padding: number;
  bounds: BoundsWithSize;
}

export function compileMapData(
  mapData: MapData,
  paddingOverride?: number
): CompiledMapData {
  const padding = Math.min(
    MAX_PADDING,
    Math.max(0, paddingOverride ?? mapData.padding ?? DEFAULT_PADDING)
  );
  const content = computeContentBounds(mapData);
  const width = content.width + padding * 2;
  const height = content.height + padding * 2;

  const shiftX = padding - content.minX;
  const shiftY = padding - content.minY;

  const normalizedStart = {
    ...mapData.start,
    x: mapData.start.x + shiftX,
    y: mapData.start.y + shiftY,
  };

  const normalizedTiles = dedupeTiles(mapData.tiles ?? [], shiftX, shiftY);
  const normalizedStars = dedupeStars(mapData.stars ?? [], shiftX, shiftY);

  const hasStartTile = normalizedTiles.some(
    (tile) => tile.x === normalizedStart.x && tile.y === normalizedStart.y
  );
  const finalTiles = hasStartTile
    ? normalizedTiles
    : [...normalizedTiles, { x: normalizedStart.x, y: normalizedStart.y, color: "R" as TileColor }];

  const bounds = normalizeBounds({
    minX: 0,
    minY: 0,
    maxX: width - 1,
    maxY: height - 1,
  });

  return {
    ...mapData,
    padding,
    start: normalizedStart,
    tiles: finalTiles,
    stars: normalizedStars,
    bounds,
    gridSize: Math.max(width, height),
  };
}

export function validateRenderSize(
  mapData: MapData,
  limit: number = MAX_RENDER_SIZE
): { width: number; height: number; ok: boolean } {
  const bounds = computeRenderBounds(mapData);
  return {
    width: bounds.width,
    height: bounds.height,
    ok: bounds.width <= limit && bounds.height <= limit,
  };
}

export function ensureStartFloor(mapData: MapData): MapData {
  const tileKey = coordToKey(mapData.start.x, mapData.start.y);
  const tiles = new Map<string, TileColor>();
  mapData.tiles?.forEach((tile) => tiles.set(coordToKey(tile.x, tile.y), tile.color));
  if (!tiles.has(tileKey)) {
    tiles.set(tileKey, "R");
  }
  return {
    ...mapData,
    tiles: Array.from(tiles.entries()).map(([key, color]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, color: color as TileColor };
    }),
  };
}
