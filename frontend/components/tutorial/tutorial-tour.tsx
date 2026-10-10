"use client";

import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TutorialTourStep, TourPlacement } from "@/lib/tutorial/levels";

interface TutorialTourProps {
  steps: TutorialTourStep[];
  onClose?: () => void;
  onComplete?: () => void;
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

export function TutorialTour({ steps, onClose, onComplete }: TutorialTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubble, setBubble] = useState<BubblePosition | null>(null);

  const total = steps.length;
  const step = useMemo(() => steps[stepIndex] ?? null, [steps, stepIndex]);

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);
  const goNext = useCallback(() => {
    if (stepIndex >= total - 1) {
      onComplete?.();
      return;
    }
    setStepIndex((prev) => Math.min(total - 1, prev + 1));
  }, [onComplete, stepIndex, total]);

  const updatePosition = () => {
    if (!step) {
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
    if (!step) return;

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
  }, [stepIndex, step]);

  if (!step) return null;

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
      {highlightStyle && (
        <div
          className="pointer-events-none absolute rounded-xl ring-[3px] ring-star shadow-[0_0_0_9999px_rgba(29,36,51,0.45)] transition-all duration-200"
          style={highlightStyle}
        />
      )}
      <div className="pointer-events-auto absolute" style={bubbleStyle}>
        <div className="animate-rise-in w-[min(320px,80vw)] rounded-2xl border border-line bg-white p-4 shadow-xl shadow-ink/15">
          <div className="text-xs text-ink-faint">
            導覽 {stepIndex + 1}/{total}
          </div>
          <div className="mt-1 text-base font-bold text-ink">{step.title}</div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
              上一步
            </Button>
            <Button size="sm" onClick={goNext}>
              {stepIndex >= total - 1 ? "結束導覽" : "下一步"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onClose?.();
              }}
            >
              關閉
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
