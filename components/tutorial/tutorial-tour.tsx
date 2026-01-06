"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TutorialTourStep, TourPlacement } from "@/lib/tutorial/levels";

interface TutorialTourProps {
  steps: TutorialTourStep[];
  open: boolean;
  onClose?: () => void;
}

interface BubblePosition {
  top: number;
  left: number;
  transform?: string;
}

function computeBubblePosition(rect: DOMRect, placement: TourPlacement = "bottom"): BubblePosition {
  const gap = 12;
  switch (placement) {
    case "top":
      return {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: "translate(-100%, -50%)",
      };
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: "translate(0, -50%)",
      };
    case "bottom":
    default:
      return {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      };
  }
}

export function TutorialTour({ steps, open, onClose }: TutorialTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubble, setBubble] = useState<BubblePosition | null>(null);

  const total = steps.length;
  const step = useMemo(() => steps[stepIndex] ?? null, [steps, stepIndex]);

  useEffect(() => {
    setStepIndex(0);
  }, [steps]);

  const goPrev = () => setStepIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => {
    if (stepIndex >= total - 1) {
      onClose?.();
      return;
    }
    setStepIndex((prev) => Math.min(total - 1, prev + 1));
  };

  const updatePosition = () => {
    if (!open || !step) {
      setTargetRect(null);
      setBubble(null);
      return;
    }

    if (!step.selector) {
      setTargetRect(null);
      setBubble({ top: 96, left: window.innerWidth / 2, transform: "translate(-50%, 0)" });
      return;
    }

    const element = document.querySelector(step.selector) as HTMLElement | null;
    if (!element) {
      setTargetRect(null);
      setBubble({ top: 96, left: window.innerWidth / 2, transform: "translate(-50%, 0)" });
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect(rect);
    setBubble(computeBubblePosition(rect, step.placement));
  };

  useLayoutEffect(() => {
    if (!open || !step) {
      setTargetRect(null);
      setBubble(null);
      return;
    }

    if (step.selector) {
      const element = document.querySelector(step.selector) as HTMLElement | null;
      if (element) {
        const rect = element.getBoundingClientRect();
        const fullyVisible =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;
        if (!fullyVisible) {
          element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }
    }

    const raf = requestAnimationFrame(() => updatePosition());
    const handleRecalc = () => requestAnimationFrame(() => updatePosition());

    window.addEventListener("resize", handleRecalc);
    window.addEventListener("scroll", handleRecalc, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleRecalc);
      window.removeEventListener("scroll", handleRecalc, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex, step]);

  useEffect(() => {
    if (!open || !step?.selector) return;
    const selector = step.selector;
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest(selector)) {
        goNext();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex, step?.selector]);

  if (!open || !step) return null;

  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 8,
        left: targetRect.left - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  const bubbleStyle = bubble
    ? {
        top: bubble.top,
        left: bubble.left,
        transform: bubble.transform,
      }
    : { top: 96, left: 96 };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="pointer-events-none absolute inset-0 bg-slate-950/25" />
      {highlightStyle && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-amber-300/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
          style={highlightStyle}
        />
      )}
      <div className="pointer-events-auto absolute" style={bubbleStyle}>
        <div className="w-[min(320px,80vw)] rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            教程引導 • {stepIndex + 1}/{total}
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{step.title}</div>
          <p className="mt-2 text-sm text-slate-600">{step.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={goPrev} disabled={stepIndex === 0}>
              上一步
            </Button>
            <Button size="sm" onClick={goNext}>
              {stepIndex >= total - 1 ? "結束導覽" : "下一步"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              關閉
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
