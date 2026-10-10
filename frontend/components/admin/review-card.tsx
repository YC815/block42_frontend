/**
 * Block42 Frontend - Review card for admin moderation.
 */

import Link from "next/link";
import { useState } from "react";
import type { LevelListItem } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

interface ReviewCardProps {
  level: LevelListItem;
  onApprove: (levelId: string) => void;
  onReject: (payload: { levelId: string; reason: string }) => void;
}

export function ReviewCard({ level, onApprove, onReject }: ReviewCardProps) {
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const authorLabel = level.author_name ?? `#${level.author_id}`;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink">{level.title}</div>
          <div className="mt-0.5 text-xs text-ink-faint">
            {authorLabel}・{formatDate(level.created_at)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/levels/${level.id}`}>查看與試玩</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting((value) => !value)}>
            駁回
          </Button>
          <Button size="sm" onClick={() => onApprove(level.id)}>
            通過並公開
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-faint">作者送出時伺服器已確認這關可解；通過時會再驗證一次。</p>

      {rejecting && (
        <div className="mt-4 space-y-2">
          <Textarea
            value={reason}
            maxLength={1000}
            onChange={(event) => setReason(event.target.value)}
            placeholder="告訴作者需要修改的地方"
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => onReject({ levelId: level.id, reason: reason.trim() })}
          >
            送出駁回
          </Button>
        </div>
      )}
    </div>
  );
}
