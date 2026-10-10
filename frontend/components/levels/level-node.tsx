/**
 * Block42 Frontend - Official level node.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { LevelListItem, LevelProgress } from "@/types/api";

interface LevelNodeProps {
  level: LevelListItem;
  index: number;
  locked?: boolean;
  progress?: LevelProgress | null;
  showProgress?: boolean;
}

export function LevelNode({
  level,
  index,
  locked = false,
  progress,
  showProgress = false,
}: LevelNodeProps) {
  const authorLabel = level.author_name ?? `#${level.author_id}`;
  const progressLabel = progress?.is_completed ? "已完成" : "未完成";
  const progressClass = progress?.is_completed
    ? "bg-emerald-500 text-white"
    : "bg-slate-200 text-slate-700";

  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
        locked ? "border-gray-300 bg-gray-100 text-gray-400" : "border-blue-600 bg-blue-600 text-white"
      }`}>
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">關卡 {index + 1}</span>
          <span className="font-semibold text-gray-900">{level.title}</span>
          <Badge className="bg-yellow-500 text-white">官方</Badge>
        </div>
        <div className="text-xs text-gray-500">作者 {authorLabel}</div>
      </div>
      <div>
        {locked ? (
          <Badge variant="outline">鎖定</Badge>
        ) : (
          <div className="flex items-center gap-2">
            {showProgress && (
              <Badge className={progressClass}>{progressLabel}</Badge>
            )}
            <Link href={`/play/${level.id}`} className="text-sm font-medium text-blue-600">
              進入
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
