/**
 * Block42 Frontend - Game Controls
 * 執行／單步／重來，加上速度切換。
 */

import { Play, RotateCcw, StepForward } from "lucide-react";

interface GameControlsProps {
  isRunning: boolean;
  speed: number;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
}

const SPEEDS = [
  { value: 0.5, label: "慢" },
  { value: 1, label: "中" },
  { value: 3, label: "快" },
];

export function GameControls({
  isRunning,
  speed,
  onRun,
  onStep,
  onReset,
  onSpeedChange,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink/85 disabled:opacity-50"
        data-tour-id="control-run"
      >
        <Play className="h-4 w-4 fill-current" />
        執行
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={isRunning}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition hover:border-ink/40 disabled:opacity-50"
        data-tour-id="control-step"
      >
        <StepForward className="h-4 w-4" />
        單步
      </button>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition hover:border-ink/40"
        data-tour-id="control-reset"
      >
        <RotateCcw className="h-4 w-4" />
        重來
      </button>
      <div
        className="flex h-9 items-center rounded-lg border border-line bg-white p-0.5"
        role="radiogroup"
        aria-label="執行速度"
      >
        {SPEEDS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={speed === option.value}
            onClick={() => onSpeedChange(option.value)}
            className={`h-full rounded-md px-2.5 text-xs font-medium transition ${
              speed === option.value ? "bg-paper-deep text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
