/**
 * Block42 Frontend - Programming Workspace
 * F0／F1／F2 三條指令列。點選格子後再從指令面板選指令；再點一次已選取的格子會清除它。
 */

import { useDroppable } from "@dnd-kit/core";
import { Eraser } from "lucide-react";
import type { LevelConfig } from "@/types/api";
import type { CommandSlot, SelectedSlot, SlotSet, TrackKey } from "@/lib/hooks/use-game-state";
import { CommandGlyph, TILE_COLORS, describeCommand } from "@/components/game/game-icons";

interface ProgrammingWorkspaceProps {
  config: LevelConfig;
  slots: SlotSet;
  selectedSlot: SelectedSlot;
  onSelectSlot: (track: TrackKey, index: number) => void;
  onClearTrack: (track: TrackKey) => void;
  disabled?: boolean;
}

const TRACK_HINT: Record<TrackKey, string> = {
  f0: "主程式，按執行時從這裡開始",
  f1: "函式",
  f2: "函式",
};

function TrackRow({
  trackKey,
  capacity,
  slots,
  selectedIndex,
  onSelectSlot,
  onClear,
  disabled,
}: {
  trackKey: TrackKey;
  capacity: number;
  slots: CommandSlot[];
  selectedIndex: number | null;
  onSelectSlot: (index: number) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const used = slots.filter((slot) => slot.type).length;
  return (
    <div className="rounded-xl border border-line bg-paper/60 px-3 py-2.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-xs font-bold text-white">
          {trackKey.toUpperCase()}
        </span>
        <span className="truncate text-xs text-ink-soft">{TRACK_HINT[trackKey]}</span>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-ink-faint">
          {used}/{capacity}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-ink-faint transition hover:bg-paper-deep hover:text-ink disabled:opacity-40"
          disabled={disabled || used === 0}
          onClick={onClear}
          aria-label={`清空 ${trackKey.toUpperCase()}`}
          title={`清空 ${trackKey.toUpperCase()}`}
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
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
  const tracks = (["f0", "f1", "f2"] as const).filter((key) => config[key] > 0);

  return (
    <div className="flex flex-col gap-2" data-tour-id="workspace">
      {tracks.map((key) => (
        <TrackRow
          key={key}
          trackKey={key}
          capacity={config[key]}
          slots={slots[key]}
          selectedIndex={selectedSlot?.track === key ? selectedSlot.index : null}
          onSelectSlot={(index) => onSelectSlot(key, index)}
          onClear={() => onClearTrack(key)}
          disabled={disabled}
        />
      ))}
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
  const { setNodeRef, isOver, active } = useDroppable({
    id: `slot-${trackKey}-${index}`,
    data: { track: trackKey, index },
    disabled,
  });

  const dragging = !disabled && active !== null;
  const label = command
    ? `${trackKey.toUpperCase()} 第 ${index + 1} 格：${describeCommand(command, condition)}`
    : condition
      ? `${trackKey.toUpperCase()} 第 ${index + 1} 格：${TILE_COLORS[condition].name}色條件，尚未放指令`
      : `${trackKey.toUpperCase()} 第 ${index + 1} 格：空`;

  return (
    <button
      type="button"
      ref={setNodeRef}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      data-tour-id={`workspace-${trackKey}-slot-${index}`}
      onClick={() => onSelectSlot(index)}
      className={`relative flex h-11 w-11 items-center justify-center rounded-lg border text-ink transition ${
        condition
          ? "border-transparent text-white"
          : command
            ? "border-line bg-white"
            : "border-dashed border-ink/20 bg-white/60"
      } ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""} ${
        isOver && dragging ? "scale-105 ring-2 ring-tile-b ring-offset-1" : ""
      } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      style={condition ? { background: TILE_COLORS[condition].fill } : undefined}
    >
      {command ? <CommandGlyph type={command} className="h-5 w-5" /> : null}
    </button>
  );
}
