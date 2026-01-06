/**
 * Block42 Frontend - Programming Workspace
 * Shows command tracks for f0/f1/f2.
 */

import type { LevelConfig, CommandType } from "@/types/api";
import type { CommandSlot, SelectedSlot, SlotSet, TrackKey } from "@/lib/hooks/use-game-state";

interface ProgrammingWorkspaceProps {
  config: LevelConfig;
  slots: SlotSet;
  selectedSlot: SelectedSlot;
  onSelectSlot: (track: TrackKey, index: number) => void;
  onClearTrack: (track: TrackKey) => void;
  disabled?: boolean;
}

const COMMAND_ICONS: Record<CommandType, { label: string; bg?: string }> = {
  move: { label: "↑" },
  turn_left: { label: "↶" },
  turn_right: { label: "↷" },
  paint_red: { label: "", bg: "bg-rose-500" },
  paint_green: { label: "", bg: "bg-emerald-500" },
  paint_blue: { label: "", bg: "bg-sky-500" },
  f0: { label: "f0" },
  f1: { label: "f1" },
  f2: { label: "f2" },
};

function BrushIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.5 4.5l4 4-9 9h-4v-4l9-9z" />
      <path d="M4 20c3 0 4-1 4-3 0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2 0 2-1 3-4 3H4z" />
    </svg>
  );
}

function TrackRow({
  label,
  trackKey,
  capacity,
  slots,
  selectedIndex,
  onSelectSlot,
  onClear,
  disabled,
}: {
  label: string;
  trackKey: TrackKey;
  capacity: number;
  slots: CommandSlot[];
  selectedIndex: number | null;
  onSelectSlot: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
      <div className="w-10 text-xs font-semibold text-slate-500">
        {label}
      </div>
      <div className="flex flex-1 items-center gap-1 overflow-x-auto pb-1">
        {Array.from({ length: capacity }).map((_, index) => {
          const slot = slots[index];
          const command = slot?.type ?? null;
          const condition = slot?.condition ?? null;
          const isSelected = selectedIndex === index;
          const isPaint =
            command === "paint_red" ||
            command === "paint_green" ||
            command === "paint_blue";
          const conditionBg =
            condition === "R"
              ? "bg-rose-500/80 text-white"
              : condition === "G"
                ? "bg-emerald-500/80 text-white"
                : condition === "B"
                  ? "bg-sky-500/80 text-white"
                  : "";
          return (
            <div
              key={`${trackKey}-${index}`}
              className={`relative flex h-9 w-9 items-center justify-center rounded border text-xs transition ${
                conditionBg
                  ? `${conditionBg} border-transparent`
                  : command
                    ? "border-slate-200/80 bg-white text-slate-700"
                    : "border-slate-100 bg-slate-50 text-slate-400"
              } ${
                isSelected ? "ring-2 ring-slate-900/70 ring-offset-1 ring-offset-white" : ""
              } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              data-tour-id={`workspace-${trackKey}-slot-${index}`}
              onClick={disabled ? undefined : () => onSelectSlot(index)}
            >
              {command ? (
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded ${
                    COMMAND_ICONS[command].bg ?? ""
                  } ${COMMAND_ICONS[command].bg ? "text-white" : ""}`}
                >
                  {isPaint ? (
                    <BrushIcon className="h-3.5 w-3.5 text-white/95" />
                  ) : (
                    COMMAND_ICONS[command].label
                  )}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
          disabled ? "border-slate-100 text-slate-300" : "border-slate-200 text-slate-500"
        }`}
        disabled={disabled}
        onClick={onClear}
      >
        清空
      </button>
    </div>
  );
}

export function ProgrammingWorkspace({
  config,
  slots,
  selectedSlot,
  onSelectSlot,
  onClearTrack,
  disabled = false,
}: ProgrammingWorkspaceProps) {
  const tracks: Array<{
    key: "f0" | "f1" | "f2";
    label: string;
    capacity: number;
    slots: CommandSlot[];
  }> = [
    { key: "f0", label: "f0", capacity: config.f0, slots: slots.f0 },
    ...(config.f1 > 0
      ? [{ key: "f1" as const, label: "f1", capacity: config.f1, slots: slots.f1 }]
      : []),
    ...(config.f2 > 0
      ? [{ key: "f2" as const, label: "f2", capacity: config.f2, slots: slots.f2 }]
      : []),
  ];

  return (
    <div
      className="flex h-full flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur"
      data-tour-id="workspace"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Functions
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        {tracks.map((track) => (
          <TrackRow
            key={track.key}
            label={track.label}
            trackKey={track.key}
            capacity={track.capacity}
            slots={track.slots}
            selectedIndex={selectedSlot?.track === track.key ? selectedSlot.index : null}
            onSelectSlot={(index) => onSelectSlot(track.key, index)}
            onClear={() => onClearTrack(track.key)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
