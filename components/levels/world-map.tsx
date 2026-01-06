/**
 * Block42 Frontend - World map for official levels.
 */

import type { LevelListItem, LevelProgress } from "@/types/api";
import { LevelNode } from "@/components/levels/level-node";

interface WorldMapProps {
  levels: LevelListItem[];
  progressMap?: Map<string, LevelProgress>;
  showProgress?: boolean;
}

export function WorldMap({ levels, progressMap, showProgress = false }: WorldMapProps) {
  return (
    <div className="space-y-6">
      {levels.map((level, index) => (
        <LevelNode
          key={level.id}
          level={level}
          index={index}
          locked={false}
          progress={progressMap?.get(level.id)}
          showProgress={showProgress}
        />
      ))}
    </div>
  );
}
