/**
 * Block42 Frontend - Game Controls
 * Run / Step / Reset + speed slider.
 */

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
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold shadow-sm transition ${
          isRunning
            ? "border-slate-200 bg-slate-100 text-slate-400"
            : "border-slate-900/60 bg-slate-900 text-white hover:bg-slate-800"
        }`}
        aria-label="開始執行"
      >
        ▶
      </button>
      <button
        type="button"
        onClick={onStep}
        disabled={isRunning}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold shadow-sm transition ${
          isRunning
            ? "border-slate-200 bg-slate-100 text-slate-400"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
        aria-label="單步執行"
      >
        ⏭
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
        aria-label="重置"
      >
        ↺
      </button>
      <div className="hidden items-center gap-2 pl-2 text-xs text-slate-500 md:flex">
        <span className="uppercase tracking-[0.2em] text-slate-400">速度</span>
        <input
          type="range"
          min={1}
          max={4}
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          className="w-20 accent-teal-500"
        />
        <span className="w-6 text-right font-semibold text-slate-700">
          {speed}x
        </span>
      </div>
    </div>
  );
}
