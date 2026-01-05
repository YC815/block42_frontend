/**
 * Block42 Frontend - Programming Workspace
 * Shows command tracks for f0/f1/f2.
 */

import type { LevelConfig, CommandType, TileColor } from "@/types/api";
import type { Command, CommandSet } from "@/lib/game-engine/types";
import { Button } from "@/components/ui/button";

interface ProgrammingWorkspaceProps {
  config: LevelConfig;
  commandSet: CommandSet;
  selectedTrack: "f0" | "f1" | "f2";
  onSelectTrack: (track: "f0" | "f1" | "f2") => void;
  onRemoveCommand: (track: "f0" | "f1" | "f2", index: number) => void;
  onClearTrack: (track: "f0" | "f1" | "f2") => void;
}

const COMMAND_LABELS: Record<CommandType, string> = {
  move: "前進",
  turn_left: "左轉",
  turn_right: "右轉",
  paint_red: "噴紅",
  paint_green: "噴綠",
  paint_blue: "噴藍",
  f1: "f1",
  f2: "f2",
};

function conditionBadge(condition?: TileColor) {
  if (!condition) return null;
  const bg =
    condition === "R"
      ? "bg-rose-500"
      : condition === "G"
        ? "bg-emerald-500"
        : "bg-sky-500";
  return <span className={`ml-2 inline-block h-2 w-2 rounded-full ${bg}`} />;
}

function TrackRow({
  label,
  trackKey,
  capacity,
  commands,
  selected,
  onSelect,
  onRemove,
  onClear,
}: {
  label: string;
  trackKey: "f0" | "f1" | "f2";
  capacity: number;
  commands: Command[];
  selected: boolean;
  onSelect: () => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          清空
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-10 gap-2">
        {Array.from({ length: capacity }).map((_, index) => {
          const command = commands[index];
          return (
            <div
              key={`${trackKey}-${index}`}
              className={`flex h-10 items-center justify-center rounded-lg border text-xs ${
                command ? "bg-white shadow-sm" : "bg-slate-100"
              }`}
              onClick={(event) => {
                event.stopPropagation();
                if (command) {
                  onRemove(index);
                }
              }}
            >
              {command ? (
                <span className="flex items-center">
                  {COMMAND_LABELS[command.type]}
                  {conditionBadge(command.condition)}
                </span>
              ) : (
                <span className="text-slate-400">空</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {commands.length}/{capacity}
      </div>
    </div>
  );
}

export function ProgrammingWorkspace({
  config,
  commandSet,
  selectedTrack,
  onSelectTrack,
  onRemoveCommand,
  onClearTrack,
}: ProgrammingWorkspaceProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <TrackRow
        label="主程式 f0"
        trackKey="f0"
        capacity={config.f0}
        commands={commandSet.f0}
        selected={selectedTrack === "f0"}
        onSelect={() => onSelectTrack("f0")}
        onRemove={(index) => onRemoveCommand("f0", index)}
        onClear={() => onClearTrack("f0")}
      />
      <TrackRow
        label="函式 f1"
        trackKey="f1"
        capacity={config.f1}
        commands={commandSet.f1}
        selected={selectedTrack === "f1"}
        onSelect={() => onSelectTrack("f1")}
        onRemove={(index) => onRemoveCommand("f1", index)}
        onClear={() => onClearTrack("f1")}
      />
      <TrackRow
        label="函式 f2"
        trackKey="f2"
        capacity={config.f2}
        commands={commandSet.f2}
        selected={selectedTrack === "f2"}
        onSelect={() => onSelectTrack("f2")}
        onRemove={(index) => onRemoveCommand("f2", index)}
        onClear={() => onClearTrack("f2")}
      />
    </div>
  );
}
