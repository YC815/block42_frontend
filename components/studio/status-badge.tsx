/**
 * Block42 Frontend - Status badge for level status.
 */

import { Badge } from "@/components/ui/badge";
import type { LevelStatus } from "@/types/api";

export function StatusBadge({ status }: { status: LevelStatus }) {
  switch (status) {
    case "draft":
      return <Badge className="bg-gray-400 text-white">草稿</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500 text-white">審核中</Badge>;
    case "published":
      return <Badge className="bg-green-600 text-white">已發布</Badge>;
    case "rejected":
      return <Badge className="bg-red-600 text-white">需修改</Badge>;
    default:
      return <Badge variant="secondary">未知</Badge>;
  }
}
