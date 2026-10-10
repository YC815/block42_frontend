"use client";

/**
 * Block42 Frontend - Execution thread bar
 * Shows the current execution queue under the board.
 */

import type { Command } from "@/lib/game-engine/types";
import { useEffect, useRef, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommandChip } from "@/components/game/game-icons";

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
  embedded,
}: ExecutionThreadProps) {
  const { allCommands, currentIndex } = reconstructExecutionHistory(
    queueSnapshots,
    timelineIndex
  );
  const isExecutionFinished = currentIndex === -1 && timelineIndex > 0;
  const currentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [currentIndex]);

  return (
    <div className={embedded ? "" : "rounded-2xl border border-line bg-white px-3 py-2.5"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-ink-soft">
          執行順序
          <span className="ml-1.5 font-normal text-ink-faint">
            {timelineIndex > 0 ? `第 ${timelineIndex} 步` : "按執行後，機器人會照這個順序做"}
          </span>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <ScrollArea
        className="mt-2"
        type="auto"
        scrollbarOrientation="horizontal"
        viewportClassName="pb-3 pt-1"
      >
        {allCommands.length > 0 ? (
          <div className="flex items-center gap-1.5 px-1">
            {allCommands.map((command, index) => (
              <div key={index} ref={index === currentIndex ? currentRef : undefined}>
                <CommandChip
                  type={command.type}
                  condition={command.condition}
                  size="sm"
                  state={
                    isExecutionFinished || index < currentIndex
                      ? "done"
                      : index === currentIndex
                        ? "current"
                        : "idle"
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-9 items-center rounded-lg border border-dashed border-line px-3 text-xs text-ink-faint">
            F0 還是空的
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
