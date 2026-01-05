/**
 * Block42 Frontend - Review card for admin moderation.
 */

import { useState } from "react";
import type { LevelListItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReviewCardProps {
  level: LevelListItem;
  onApprove: (payload: { levelId: string; asOfficial: boolean; officialOrder?: number }) => void;
  onReject: (payload: { levelId: string; reason: string }) => void;
}

export function ReviewCard({ level, onApprove, onReject }: ReviewCardProps) {
  const [officialOrder, setOfficialOrder] = useState<number | "">("");
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">{level.title}</div>
          <div className="text-xs text-gray-500">作者 #{level.author_id}</div>
        </div>
        <div className="text-xs text-gray-400">
          {new Date(level.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">官方順序</div>
          <Input
            type="number"
            min={0}
            value={officialOrder}
            onChange={(event) => setOfficialOrder(event.target.value === "" ? "" : Number(event.target.value))}
            placeholder="輸入 official_order"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                onApprove({
                  levelId: level.id,
                  asOfficial: false,
                })
              }
            >
              通過（社群）
            </Button>
            <Button
              size="sm"
              onClick={() =>
                onApprove({
                  levelId: level.id,
                  asOfficial: true,
                  officialOrder: officialOrder === "" ? undefined : officialOrder,
                })
              }
            >
              通過（官方）
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">駁回原因</div>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="請輸入駁回理由"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject({ levelId: level.id, reason })}
          >
            駁回
          </Button>
        </div>
      </div>
    </div>
  );
}
