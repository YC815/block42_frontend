"use client";

/**
 * Block42 Frontend - Game Workbench
 * 遊玩畫面的共用版面：地圖、執行控制、指令列、指令面板。
 * 正式遊玩、工作室試玩、編輯器試玩都用這一份，行為和外觀才會一致。
 */

import { useEffect, type ReactNode } from "react";
import { GameCanvas } from "@/components/game/game-canvas";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameDndProvider } from "@/components/game/game-dnd-provider";
import { StarIcon } from "@/components/game/game-icons";
import { explainFailure } from "@/lib/game-engine/explain";
import { stepDurationFor, type useGameState } from "@/lib/hooks/use-game-state";
import type { LevelConfig, MapData } from "@/types/api";

type GameController = ReturnType<typeof useGameState>;

interface GameWorkbenchProps {
  mapData: MapData;
  config: LevelConfig;
  game: GameController;
  /** 過關時蓋在地圖上的內容（通常是 GameResultOverlay） */
  successOverlay?: ReactNode;
  /** 右欄最上方，例如關卡目標與提示 */
  aside?: ReactNode;
  /** 地圖區的高度，預設會隨視窗高度調整 */
  boardClassName?: string;
}

export function GameWorkbench({
  mapData,
  config,
  game,
  successOverlay,
  aside,
  boardClassName = "h-[clamp(260px,52vh,620px)]",
}: GameWorkbenchProps) {
  const state = game.currentState;
  const totalStars = mapData.stars.length;
  const collected = state?.collectedStars.size ?? 0;
  const failure =
    state?.status === "failure" && game.isComplete ? explainFailure(state, totalStars) : null;

  // Delete／Backspace 清除選取的格子
  const { clearSelectedSlot } = game;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "Backspace" || event.key === "Delete") {
        clearSelectedSlot();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSelectedSlot]);

  return (
    <GameDndProvider
      onDropCommand={game.dropCommand}
      onDropCondition={game.dropCondition}
      disabled={game.isEditingLocked}
    >
      {/* 手機：目標 → 地圖 → 程式；桌機：地圖在左，目標與程式在右 */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:grid-rows-[auto_1fr]">
        {aside && <div className="min-w-0 lg:col-start-2 lg:row-start-1">{aside}</div>}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <div
            className={`relative overflow-hidden rounded-2xl border border-line bg-grid-paper p-3 ${boardClassName}`}
          >
            <GameCanvas
              mapData={mapData}
              state={state}
              fitToContainer
              stepDurationMs={stepDurationFor(game.speed)}
            />
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
              <StarIcon className="h-4 w-4" />
              <span className="tabular-nums">
                {collected}/{totalStars}
              </span>
              <span className="mx-1 h-3 w-px bg-line" />
              <span className="tabular-nums text-ink-soft">{state?.steps ?? 0} 步</span>
            </div>
            {game.didSucceed && successOverlay}
          </div>

          <ExecutionThreadBar
            queueSnapshots={game.queueSnapshots}
            timelineIndex={game.timelineIndex}
            actions={
              <GameControls
                isRunning={game.isRunning}
                speed={game.speed}
                onRun={game.run}
                onStep={game.step}
                onReset={game.reset}
                onSpeedChange={game.setSpeed}
              />
            }
          />

          {failure && (
            <div
              role="alert"
              className="animate-rise-in rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm"
            >
              <div className="font-semibold text-destructive">{failure.title}</div>
              <div className="mt-0.5 text-ink-soft">{failure.detail}</div>
            </div>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-3 lg:col-start-2 lg:row-start-2">
          <ProgrammingWorkspace
            config={config}
            slots={game.slots}
            selectedSlot={game.selectedSlot}
            onSelectSlot={game.selectSlot}
            onClearTrack={game.clearTrack}
            disabled={game.isEditingLocked}
          />
          <CommandToolbox
            config={config}
            activeCommand={game.selectedSlotState?.type ?? null}
            activeCondition={game.selectedSlotState?.condition ?? null}
            disabled={!game.selectedSlot || game.isEditingLocked}
            onSelectCommand={game.applyCommand}
            onSelectCondition={game.applyCondition}
          />
          <p className="px-1 text-xs leading-relaxed text-ink-faint">
            先點選上面的格子，再點指令放進去；也可以直接拖曳。再點一次已選取的格子，或按 Delete 可以清除。
          </p>
        </aside>
      </div>
    </GameDndProvider>
  );
}
