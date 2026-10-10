"use client";

/**
 * Block42 Frontend - Game result overlay
 */

import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

interface GameResultOverlayProps {
  title: string;
  description?: ReactNode;
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
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-paper/70 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-live="polite"
        className="animate-rise-in w-[min(360px,92%)] rounded-2xl border border-line bg-white p-6 text-center shadow-xl shadow-ink/10"
      >
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            tone === "success" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {tone === "success" ? <Check className="h-6 w-6" strokeWidth={3} /> : <X className="h-6 w-6" strokeWidth={3} />}
        </div>
        <h2 className="mt-3 text-xl font-bold text-ink">{title}</h2>
        {description && <div className="mt-1.5 text-sm text-ink-soft">{description}</div>}
        {(primaryAction || secondaryAction) && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
