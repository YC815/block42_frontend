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
import { RobotIcon, StarIcon, TILE_COLORS } from "@/components/game/game-icons";

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
    <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-white p-3">
      <div className="z-20 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
        <div className="flex items-center gap-2">
          <span>縮放</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-28 accent-[var(--ink)]"
          />
          <span className="w-10 text-right tabular-nums text-ink">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink transition hover:border-ink/40"
            onClick={() => setZoom(1)}
          >
            原始大小
          </button>
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink transition hover:border-ink/40"
            onClick={() => setCamera(contentCenter)}
          >
            對齊內容
          </button>
          <button
            type="button"
            className="rounded-lg border border-line bg-white px-2.5 py-1 font-medium text-ink transition hover:border-ink/40"
            onClick={() => setCamera({ x: mapData.start.x, y: mapData.start.y })}
          >
            回到起點
          </button>
          <button
            type="button"
            aria-pressed={handMode}
            className={`rounded-lg border px-2.5 py-1 font-medium transition ${
              handMode
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:border-ink/40"
            }`}
            onClick={() => setHandMode((prev) => !prev)}
          >
            移動畫面
          </button>
        </div>
      </div>

      <div
        className="relative z-10 flex flex-1 overflow-hidden rounded-xl bg-grid-paper"
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
                    className="absolute rounded-[14px] border border-dashed border-ink/25"
                    style={{
                      left: rectTopLeftX,
                      top: rectTopLeftY,
                      width: rectWidth,
                      height: rectHeight,
                    }}
                  />
                  {cells.map(({ x, y, key }) => {
                    const tileColor = tileMap.get(key);
                    const hasStar = stars.has(key);
                    const isStart = mapData.start.x === x && mapData.start.y === y;

                    const left =
                      containerSize.width / 2 + (x - camera.x) * step - cellSize / 2;
                    const top =
                      containerSize.height / 2 + (y - camera.y) * step - cellSize / 2;

                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`(${x}, ${y})`}
                        className={`absolute flex items-center justify-center rounded-[22%] transition ${
                          tileColor ? "" : "bg-ink/[0.04] hover:bg-ink/[0.12]"
                        }`}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          transform: `translate(${left}px, ${top}px)`,
                          ...(tileColor
                            ? {
                                background: TILE_COLORS[tileColor].fill,
                                boxShadow: `inset 0 -${Math.max(2, Math.round(cellSize * 0.08))}px 0 ${TILE_COLORS[tileColor].deep}`,
                              }
                            : {}),
                        }}
                        onClick={() => handleCellClick(x, y)}
                      >
                        {hasStar && <StarIcon className="absolute h-[62%] w-[62%]" />}
                        {isStart && (
                          <span
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ rotate: `${mapData.start.dir * 90}deg` }}
                          >
                            <RobotIcon className="h-[78%] w-[78%]" />
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

      <p className="relative mt-2 text-xs text-ink-faint">
        點格子編輯。按住 Alt 或右鍵拖曳可以移動畫面，Ctrl／⌘＋滾輪可以縮放。起點再點一次會轉向。
      </p>
    </div>
  );
}
