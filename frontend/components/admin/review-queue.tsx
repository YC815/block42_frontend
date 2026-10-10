/**
 * Block42 Frontend - Review queue list.
 */

import type { LevelListItem } from "@/types/api";
import { ReviewCard } from "@/components/admin/review-card";

interface ReviewQueueProps {
  levels: LevelListItem[];
  onApprove: (levelId: string) => void;
  onReject: (payload: { levelId: string; reason: string }) => void;
}

export function ReviewQueue({ levels, onApprove, onReject }: ReviewQueueProps) {
  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <ReviewCard
          key={level.id}
          level={level}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
