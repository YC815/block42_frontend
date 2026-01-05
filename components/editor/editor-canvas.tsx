/**
 * Block42 Frontend - Editor canvas
 * Allows map editing with simple grid interactions.
 */

import type { MapData, TileColor } from "@/types/api";
import { coordToKey } from "@/lib/game-engine/types";
import type { EditorTool } from "@/components/editor/editor-toolbar";

interface EditorCanvasProps {
  mapData: MapData;
  tool: EditorTool;
  color: TileColor;
  onChange: (mapData: MapData) => void;
}

const GRID_SIZE = 10;

export function EditorCanvas({ mapData, tool, color, onChange }: EditorCanvasProps) {
  const tiles = new Map<string, TileColor>();
  mapData.tiles.forEach((tile) => tiles.set(coordToKey(tile.x, tile.y), tile.color));

  const stars = new Set(mapData.stars.map((star) => coordToKey(star.x, star.y)));

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
    <div className="rounded-2xl border bg-slate-900/80 p-4">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 28px))`,
        }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => {
            const key = coordToKey(x, y);
            const tileColor = tiles.get(key);
            const hasStar = stars.has(key);
            const isStart = mapData.start.x === x && mapData.start.y === y;

            const cellColor = tileColor
              ? tileColor === "R"
                ? "bg-rose-500/80"
                : tileColor === "G"
                  ? "bg-emerald-500/80"
                  : "bg-sky-500/80"
              : "bg-slate-800";

            return (
              <button
                key={key}
                type="button"
                className={`relative h-7 w-7 rounded-md border border-slate-700 ${cellColor}`}
                onClick={() => handleCellClick(x, y)}
              >
                {hasStar && <span className="absolute inset-0 flex items-center justify-center text-xs">⭐</span>}
                {isStart && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white">
                    ▲
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      <p className="mt-3 text-xs text-slate-300">
        點擊格子進行編輯，起點再次點擊可旋轉方向。
      </p>
    </div>
  );
}
