/**
 * Block42 Frontend - Game Controls
 * Run / Step / Reset + speed slider.
 */

import { Button } from "@/components/ui/button";

interface GameControlsProps {
  isRunning: boolean;
  speed: number;
  onRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
}

export function GameControls({
  isRunning,
  speed,
  onRun,
  onStep,
  onReset,
  onSpeedChange,
}: GameControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white/80 px-4 py-3 shadow-sm">
      <Button onClick={onRun} disabled={isRunning}>
        {isRunning ? "執行中" : "Run"}
      </Button>
      <Button variant="secondary" onClick={onStep} disabled={isRunning}>
        Step
      </Button>
      <Button variant="outline" onClick={onReset}>
        Reset
      </Button>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>速度</span>
        <input
          type="range"
          min={1}
          max={4}
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        />
        <span className="font-medium">{speed}x</span>
      </div>
    </div>
  );
}
