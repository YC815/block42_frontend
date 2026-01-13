"use client";

/**
 * Block42 Frontend - Execution thread bar
 * Shows the current execution queue under the board.
 */

import type { Command } from "@/lib/game-engine/types";
import type { CommandType, TileColor } from "@/types/api";
import type { ReactNode } from "react";
import { ArrowBigUp, CornerUpLeft, CornerUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * 從 queueSnapshots 重構完整的執行歷史
 * 將「每步剩餘佇列」反推為「已執行 + 執行中 + 待執行」的完整歷史
 */
function reconstructExecutionHistory(
  queueSnapshots: Command[][],
  timelineIndex: number
): {
  allCommands: Command[];
  executedCount: number;
  currentIndex: number;
} {
  if (timelineIndex === 0 || queueSnapshots.length === 0) {
    return {
      allCommands: queueSnapshots[0] || [],
      executedCount: 0,
      currentIndex: -1,
    };
  }

  const executed: Command[] = [];

  for (let i = 0; i < timelineIndex && i < queueSnapshots.length - 1; i++) {
    const prevQueue = queueSnapshots[i] || [];
    if (prevQueue.length === 0) break;
    executed.push(prevQueue[0]);
  }

  const currentQueue = queueSnapshots[timelineIndex] || [];
  const allCommands = [...executed, ...currentQueue];
  const executedCount = executed.length;
  const currentIndex = currentQueue.length > 0 ? executedCount : -1;

  return { allCommands, executedCount, currentIndex };
}

const COMMAND_ICONS: Record<CommandType, { label?: string; icon?: "move" | "turn_left" | "turn_right" }> = {
  move: { icon: "move" },
  turn_left: { icon: "turn_left" },
  turn_right: { icon: "turn_right" },
  paint_red: { label: "" },
  paint_green: { label: "" },
  paint_blue: { label: "" },
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
  queueSnapshots: Command[][];
  timelineIndex: number;
  actions?: ReactNode;
  embedded?: boolean;
}

export function ExecutionThreadBar({
  queueSnapshots,
  timelineIndex,
  actions,
  embedded
}: ExecutionThreadProps) {
  const { allCommands, currentIndex } = reconstructExecutionHistory(
    queueSnapshots,
    timelineIndex
  );
  const hasQueue = allCommands.length > 0;
  const isExecutionFinished = currentIndex === -1 && timelineIndex > 0;
  const containerClass = embedded
    ? "border-0 bg-transparent px-0 py-0 shadow-none"
    : "border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur";

  return (
    <div className={`rounded-2xl ${containerClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Execution
          <span className="rounded-full border border-slate-200/70 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
            {allCommands.length}
          </span>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <ScrollArea
        className="mt-2 min-h-[72px]"
        type="auto"
        scrollbarOrientation="horizontal"
        scrollbarForceMount
        viewportClassName="pt-2 pb-4"
        scrollbarClassName="rounded-full bg-slate-50 data-[state=hidden]:pointer-events-none data-[state=visible]:bg-slate-100"
        scrollbarThumbClassName="bg-slate-200 data-[state=hidden]:opacity-40 data-[state=hidden]:pointer-events-none data-[state=visible]:bg-slate-400"
      >
        {hasQueue ? (
          <div className="flex items-start gap-2">
            {allCommands.map((command, index) => {
              const iconDef = COMMAND_ICONS[command.type];
              const isExecuted = isExecutionFinished || index < currentIndex;
              const isExecuting = index === currentIndex;

              const styles = isExecuted
                ? "border-slate-200/50 bg-slate-100/50 text-slate-400"
                : isExecuting
                  ? "border-slate-900/40 bg-slate-900 text-white shadow-[0_10px_20px_-14px_rgba(15,23,42,0.6)]"
                  : "border-slate-200/80 bg-white text-slate-700";

              return (
                <div
                  key={`${command.type}-${index}`}
                  className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition ${styles}`}
                >
                  {iconDef.icon === "move" ? (
                    <ArrowBigUp className="h-5 w-5" strokeWidth={2} />
                  ) : iconDef.icon === "turn_left" ? (
                    <CornerUpLeft className="h-4 w-4" strokeWidth={2.5} />
                  ) : iconDef.icon === "turn_right" ? (
                    <CornerUpRight className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span>{iconDef.label}</span>
                  )}
                  {conditionBadge(command.condition)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            尚未配置指令
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
