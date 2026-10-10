/**
 * Block42 Frontend - Level table for studio dashboard.
 */

import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { LevelListItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/studio/status-badge";

interface LevelTableProps {
  levels: LevelListItem[];
  onDelete: (levelId: string) => void;
}

export function LevelTable({ levels, onDelete }: LevelTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead>建立時間</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels.map((level) => (
            <TableRow key={level.id}>
              <TableCell className="font-medium">{level.title}</TableCell>
              <TableCell>
                <StatusBadge status={level.status} />
              </TableCell>
              <TableCell>
                {formatDate(level.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {level.status === "published" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/play/${level.id}`}>玩</Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/studio/editor/${level.id}`}>編輯</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => onDelete(level.id)}
                  >
                    刪除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
