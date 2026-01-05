/**
 * Block42 Frontend - Official level node.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { LevelListItem } from "@/types/api";

interface LevelNodeProps {
  level: LevelListItem;
  index: number;
  locked?: boolean;
}

export function LevelNode({ level, index, locked = false }: LevelNodeProps) {
  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
        locked ? "border-gray-300 bg-gray-100 text-gray-400" : "border-blue-600 bg-blue-600 text-white"
      }`}>
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{level.title}</span>
          <Badge className="bg-yellow-500 text-white">官方</Badge>
        </div>
        <div className="text-xs text-gray-500">作者 #{level.author_id}</div>
      </div>
      <div>
        {locked ? (
          <Badge variant="outline">鎖定</Badge>
        ) : (
          <Link href={`/play/${level.id}`} className="text-sm font-medium text-blue-600">
            進入
          </Link>
        )}
      </div>
    </div>
  );
}
