"use client";

/**
 * Block42 Frontend - Play Level Page
 */

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLevelById } from "@/lib/api/levels";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameCanvas } from "@/components/game/game-canvas";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { useNavbar } from "@/components/layout/navbar-context";

export default function PlayLevelPage() {
  const params = useParams();
  const levelId = params.levelId as string;

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId),
  });

  const { data: level } = levelQuery;
  const { setLevelInfo } = useNavbar();

  const game = useGameState({
    mapData: level?.map,
    config: level?.config,
  });

  useEffect(() => {
    if (!level) return;
    setLevelInfo({ label: "Level", title: level.title });
    return () => setLevelInfo(null);
  }, [level, setLevelInfo]);

  if (levelQuery.isLoading) {
    return <div className="p-6">載入關卡中...</div>;
  }

  if (levelQuery.isError || !level) {
    return <div className="p-6 text-red-500">關卡載入失敗</div>;
  }

  const currentState = game.currentState;
  const queueSnapshot =
    game.queueSnapshots[
      Math.min(game.timelineIndex, Math.max(0, game.queueSnapshots.length - 1))
    ] ??
    [];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_40%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-3 px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-[3] flex-col gap-3">
            <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-[28px] border border-slate-900/10 bg-slate-950/90 p-4 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.9)]">
              <div className="relative flex min-h-0 flex-1 items-stretch">
                <GameCanvas
                  mapData={level.map}
                  state={currentState}
                  fitToContainer
                />
                <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-white/10" />
              </div>
              <div className="border-t border-white/10 pt-3">
                <ExecutionThreadBar
                  queue={queueSnapshot}
                  embedded
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
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-[2] gap-3">
            <div className="w-[clamp(180px,22vw,240px)] shrink-0">
              <CommandToolbox
                config={level.config}
                activeCommand={game.selectedSlotState?.type ?? null}
                activeCondition={game.selectedSlotState?.condition ?? null}
                disabled={!game.selectedSlot}
                onSelectCommand={game.applyCommand}
                onSelectCondition={game.applyCondition}
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <ProgrammingWorkspace
                config={level.config}
                slots={game.slots}
                selectedSlot={game.selectedSlot}
                onSelectSlot={game.selectSlot}
                onClearTrack={game.clearTrack}
              />
              {game.execution?.finalState.status === "failure" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {game.execution.finalState.error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
