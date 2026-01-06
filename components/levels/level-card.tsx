/**
 * Block42 Frontend - Community level card.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LevelListItem, LevelProgress } from "@/types/api";

interface LevelCardProps {
  level: LevelListItem;
  progress?: LevelProgress | null;
  showProgress?: boolean;
}

export function LevelCard({ level, progress, showProgress = false }: LevelCardProps) {
  const authorLabel = level.author_name ?? `#${level.author_id}`;
  const progressLabel = progress?.is_completed ? "已完成" : "未完成";
  const progressClass = progress?.is_completed
    ? "bg-emerald-500 text-white"
    : "bg-slate-200 text-slate-700";

  return (
    <Link href={`/play/${level.id}`} className="block">
      <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg">{level.title}</CardTitle>
            {showProgress && (
              <Badge className={progressClass}>{progressLabel}</Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">作者 {authorLabel}</div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>社群關卡</span>
            <Badge variant="secondary">依時間排序</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-slate-200 text-slate-700">難度未知</Badge>
            <Badge className="bg-slate-200 text-slate-700">0/3 ⭐</Badge>
          </div>
          <div className="text-xs text-gray-400">建立於 {new Date(level.created_at).toLocaleDateString()}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
