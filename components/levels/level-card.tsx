/**
 * Block42 Frontend - Community level card.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LevelListItem } from "@/types/api";

interface LevelCardProps {
  level: LevelListItem;
}

export function LevelCard({ level }: LevelCardProps) {
  return (
    <Link href={`/play/${level.id}`} className="block">
      <Card className="h-full transition hover:-translate-y-1 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{level.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>作者 #{level.author_id}</span>
            <Badge variant="secondary">社群</Badge>
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
