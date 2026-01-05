/**
 * Block42 Frontend - World map for official levels.
 */

import type { LevelListItem } from "@/types/api";
import { LevelNode } from "@/components/levels/level-node";

interface WorldMapProps {
  levels: LevelListItem[];
}

export function WorldMap({ levels }: WorldMapProps) {
  return (
    <div className="space-y-6">
      {levels.map((level, index) => (
        <LevelNode key={level.id} level={level} index={index} locked={false} />
      ))}
    </div>
  );
}
