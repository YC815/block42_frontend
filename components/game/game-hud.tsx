/**
 * Block42 Frontend - Game HUD
 * Shows level title, steps, and star progress.
 */

import { Badge } from "@/components/ui/badge";

interface GameHUDProps {
  title: string;
  steps: number;
  bestSteps?: number | null;
  collectedStars: number;
  totalStars: number;
  status?: "idle" | "running" | "success" | "failure";
  boardSize?: number;
}

export function GameHUD({
  title,
  steps,
  bestSteps,
  collectedStars,
  totalStars,
  status,
  boardSize,
}: GameHUDProps) {
  const statusLabel =
    status === "success" ? "通關" : status === "failure" ? "失敗" : null;
  const statusClass =
    status === "success"
      ? "bg-emerald-500 text-white"
      : status === "failure"
        ? "bg-rose-500 text-white"
        : "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Level
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1">
            ⭐ {collectedStars}/{totalStars}
          </span>
          {boardSize && (
            <span className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500">
              棋盤 {boardSize}x{boardSize}
            </span>
          )}
          {statusLabel && (
            <Badge className={statusClass}>{statusLabel}</Badge>
          )}
        </div>
      </div>
      <div className="min-w-[160px] text-right">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Steps
        </div>
        <div className="mt-2 text-2xl font-semibold text-slate-900">
          {steps}
          <span className="text-base font-medium text-slate-400"> / </span>
          <span className="text-base font-medium text-slate-400">
            {bestSteps ?? "--"}
          </span>
        </div>
      </div>
    </div>
  );
}
