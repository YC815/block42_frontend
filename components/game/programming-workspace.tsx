/**
 * Block42 Frontend - Programming Workspace
 * Shows command tracks for f0/f1/f2.
 */

import { useDroppable } from "@dnd-kit/core";
import { ArrowBigUp, CornerUpLeft, CornerUpRight, PaintBucket } from "lucide-react";
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

function CommandIcon({ command }: { command: CommandType }) {
  if (command === "move") {
    return <ArrowBigUp className="h-4 w-4" strokeWidth={2} />;
  }
  if (command === "turn_left") {
    return <CornerUpLeft className="h-3.5 w-3.5" strokeWidth={2.5} />;
  }
  if (command === "turn_right") {
    return <CornerUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />;
  }
  if (command === "paint_red" || command === "paint_green" || command === "paint_blue") {
    const bg =
      command === "paint_red"
        ? "bg-rose-500"
        : command === "paint_green"
          ? "bg-emerald-500"
          : "bg-sky-500";
    return (
      <span className={`flex h-6 w-6 items-center justify-center rounded ${bg}`}>
        <PaintBucket className="h-3.5 w-3.5 text-white/95" strokeWidth={2.5} />
      </span>
    );
  }
  // Functions (f0, f1, f2)
  return <span className="text-[10px] font-semibold">{command}</span>;
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
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3">
      <div className="w-10 text-xs font-semibold text-slate-500">
        {label}
      </div>
      <div className="flex flex-1 items-center gap-2 overflow-x-auto px-1 py-1">
        {Array.from({ length: capacity }).map((_, index) => (
          <DroppableSlot
            key={`${trackKey}-${index}`}
            trackKey={trackKey}
            index={index}
            slot={slots[index]}
            selected={selectedIndex === index}
            disabled={disabled}
            onSelectSlot={onSelectSlot}
          />
        ))}
      </div>
      <button
        type="button"
        className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${
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
      className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur"
      data-tour-id="workspace"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Functions
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
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

function DroppableSlot({
  trackKey,
  index,
  slot,
  selected,
  disabled,
  onSelectSlot,
}: {
  trackKey: TrackKey;
  index: number;
  slot: CommandSlot | undefined;
  selected: boolean;
  disabled?: boolean;
  onSelectSlot: (index: number) => void;
}) {
  const command = slot?.type ?? null;
  const condition = slot?.condition ?? null;
  const conditionBg =
    condition === "R"
      ? "bg-rose-500/80 text-white"
      : condition === "G"
        ? "bg-emerald-500/80 text-white"
        : condition === "B"
          ? "bg-sky-500/80 text-white"
          : "";

  const { setNodeRef, isOver, active } = useDroppable({
    id: `slot-${trackKey}-${index}`,
    data: {
      track: trackKey,
      index,
    },
    disabled,
  });

  const canDrop = !disabled && active !== null;
  const showDropIndicator = canDrop && isOver;

  return (
    <div
      ref={setNodeRef}
      className={`relative flex h-11 w-11 items-center justify-center rounded-lg border text-xs transition ${
        conditionBg
          ? `${conditionBg} border-transparent`
          : command
            ? "border-slate-200/80 bg-white text-slate-700"
            : "border-slate-100 bg-slate-50 text-slate-400"
      } ${
        selected ? "ring-2 ring-slate-900/70 ring-offset-1 ring-offset-white" : ""
      } ${
        showDropIndicator
          ? "ring-2 ring-slate-900 ring-offset-1"
          : canDrop
            ? "ring-2 ring-dashed ring-slate-300"
            : ""
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      data-tour-id={`workspace-${trackKey}-slot-${index}`}
      onClick={disabled ? undefined : () => onSelectSlot(index)}
    >
      {command ? <CommandIcon command={command} /> : null}
    </div>
  );
}
