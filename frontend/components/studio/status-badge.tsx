/**
 * Block42 Frontend - Level status badge
 */

import type { LevelStatus } from "@/types/api";

const STYLES: Record<LevelStatus, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-paper-deep text-ink-soft" },
  pending: { label: "審核中", className: "bg-star/15 text-star-deep" },
  published: { label: "已公開", className: "bg-success/10 text-success" },
  rejected: { label: "需修改", className: "bg-destructive/10 text-destructive" },
};

export function StatusBadge({ status }: { status: LevelStatus }) {
  const style = STYLES[status] ?? { label: "未知", className: "bg-paper-deep text-ink-soft" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}
