"use client";

/**
 * Block42 Frontend - Game result overlay
 */

import type { ReactNode } from "react";

interface GameResultOverlayProps {
  title: string;
  description?: string;
  tone?: "success" | "failure";
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
}

export function GameResultOverlay({
  title,
  description,
  tone = "success",
  primaryAction,
  secondaryAction,
}: GameResultOverlayProps) {
  const accent =
    tone === "success"
      ? "bg-emerald-100 text-emerald-600"
      : "bg-rose-100 text-rose-600";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm">
      <div className="w-[min(420px,92%)] rounded-[28px] border border-white/70 bg-white/95 p-6 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.6)]">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${accent}`}>
          {tone === "success" ? "✓" : "!"}
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
