/**
 * Block42 Frontend - Game Canvas
 * Renders the map grid, stars, and rocket.
 */

import type { MapData, TileColor } from "@/types/api";
import type { GameState } from "@/lib/game-engine/types";
import { coordToKey } from "@/lib/game-engine/types";

interface GameCanvasProps {
  mapData: MapData;
  state: GameState | null;
}

function getBounds(mapData: MapData) {
  const xs = [mapData.start.x];
  const ys = [mapData.start.y];

  for (const tile of mapData.tiles) {
    xs.push(tile.x);
    ys.push(tile.y);
  }
  for (const star of mapData.stars) {
    xs.push(star.x);
    ys.push(star.y);
  }

  const maxX = xs.length ? Math.max(...xs) : 9;
  const maxY = ys.length ? Math.max(...ys) : 9;

  return {
    width: Math.max(1, maxX + 1),
    height: Math.max(1, maxY + 1),
  };
}

function tileColorClass(color: TileColor) {
  switch (color) {
    case "R":
      return "bg-rose-500/80";
    case "G":
      return "bg-emerald-500/80";
    case "B":
      return "bg-sky-500/80";
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

export function GameCanvas({ mapData, state }: GameCanvasProps) {
  const { width, height } = getBounds(mapData);
  const tileMap = new Map<string, TileColor>();
  mapData.tiles.forEach((tile) => {
    tileMap.set(coordToKey(tile.x, tile.y), tile.color);
  });
  const starSet = new Set(mapData.stars.map((star) => coordToKey(star.x, star.y)));

  const paintedTiles = state?.paintedTiles ?? new Map<string, TileColor>();
  const collected = state?.collectedStars ?? new Set<string>();

  const cells = [] as Array<{ x: number; y: number; key: string }>; // y-major
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells.push({ x, y, key: coordToKey(x, y) });
    }
  }

  const rocketPos = state?.position;
  const rocketDir = state?.direction ?? mapData.start.dir;

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(15,23,42,0.7),rgba(15,23,42,0.9))]" />
      <div className="relative h-full w-full p-6">
        <div
          className="mx-auto grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 28px))`,
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
                className={`relative h-7 w-7 rounded-md border border-slate-700/70 ${
                  color ? tileColorClass(color) : "bg-slate-800/80"
                }`}
              >
                {hasStar && (
                  <div
                    className={`absolute inset-0 flex items-center justify-center text-xs transition ${
                      isCollected ? "opacity-30" : "opacity-100"
                    }`}
                  >
                    ⭐
                  </div>
                )}
                {isRocket && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={`h-5 w-5 text-white ${directionRotation(rocketDir)}`}
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
  );
}
