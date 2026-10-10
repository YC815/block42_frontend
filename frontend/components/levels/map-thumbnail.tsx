/**
 * 地圖縮圖：用 SVG 畫出地板與星星，給列表與首頁用
 */

import type { MapData } from "@/types/api";
import { TILE_COLORS } from "@/components/game/game-icons";
import { computeRenderBounds } from "@/lib/map-utils";

export function MapThumbnail({ map, className }: { map: MapData; className?: string }) {
  const bounds = computeRenderBounds(map);
  const size = Math.max(bounds.width, bounds.height);
  const offsetX = (size - bounds.width) / 2 - bounds.minX;
  const offsetY = (size - bounds.height) / 2 - bounds.minY;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true">
      {map.tiles.map((tile) => (
        <rect
          key={`${tile.x},${tile.y}`}
          x={tile.x + offsetX + 0.06}
          y={tile.y + offsetY + 0.06}
          width={0.88}
          height={0.88}
          rx={0.2}
          fill={TILE_COLORS[tile.color].fill}
        />
      ))}
      {map.stars.map((star) => (
        <circle
          key={`s${star.x},${star.y}`}
          cx={star.x + offsetX + 0.5}
          cy={star.y + offsetY + 0.5}
          r={0.22}
          fill="var(--star)"
          stroke="#fff"
          strokeWidth={0.08}
        />
      ))}
      <circle
        cx={map.start.x + offsetX + 0.5}
        cy={map.start.y + offsetY + 0.5}
        r={0.26}
        fill="var(--ink)"
        stroke="#fff"
        strokeWidth={0.1}
      />
    </svg>
  );
}
