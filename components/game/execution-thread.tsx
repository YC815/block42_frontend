/**
 * Block42 Frontend - Execution thread bar
 * Shows the current execution queue under the board.
 */

import type { Command } from "@/lib/game-engine/types";
import type { CommandType, TileColor } from "@/types/api";
import type { ReactNode } from "react";
import { Paintbrush } from "lucide-react";

const COMMAND_ICONS: Record<CommandType, { label: string; icon?: "paintbrush"; color?: string }> = {
  move: { label: "↑" },
  turn_left: { label: "↶" },
  turn_right: { label: "↷" },
  paint_red: { label: "", icon: "paintbrush", color: "text-rose-500" },
  paint_green: { label: "", icon: "paintbrush", color: "text-emerald-500" },
  paint_blue: { label: "", icon: "paintbrush", color: "text-sky-500" },
  f0: { label: "f0" },
  f1: { label: "f1" },
  f2: { label: "f2" },
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

interface ExecutionThreadProps {
  queue: Command[];
  actions?: ReactNode;
  embedded?: boolean;
}

export function ExecutionThreadBar({ queue, actions, embedded }: ExecutionThreadProps) {
  const hasQueue = queue.length > 0;
  const containerClass = embedded
    ? "border-0 bg-transparent px-0 py-0 shadow-none"
    : "border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur";

  return (
    <div className={`rounded-2xl ${containerClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Execution
          <span className="rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            {queue.length}
          </span>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
        {hasQueue ? (
          queue.map((command, index) => {
            const iconDef = COMMAND_ICONS[command.type];
            return (
              <div
                key={`${command.type}-${index}`}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                  index === 0
                    ? "border-slate-900/40 bg-slate-900 text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,0.6)]"
                    : "border-slate-200/80 bg-white text-slate-700"
                }`}
              >
                {iconDef.icon === "paintbrush" ? (
                  <Paintbrush className={`h-4 w-4 ${iconDef.color ?? ""}`} strokeWidth={2.5} />
                ) : (
                  <span>{iconDef.label}</span>
                )}
                {conditionBadge(command.condition)}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            尚未配置指令
          </div>
        )}
      </div>
    </div>
  );
}
