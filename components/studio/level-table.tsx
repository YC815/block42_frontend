/**
 * Block42 Frontend - Level table for studio dashboard.
 */

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
    <div className="rounded-2xl border bg-white shadow-sm">
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
                {new Date(level.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/studio/editor/${level.id}`}>
                    <Button size="sm" variant="secondary">
                      編輯
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
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
