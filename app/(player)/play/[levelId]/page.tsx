"use client";

/**
 * Block42 Frontend - Play Level Page
 */

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLevelById,
  getLevelProgram,
  getOfficialLevels,
  updateLevelProgram,
  updateLevelProgress,
} from "@/lib/api/levels";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameCanvas } from "@/components/game/game-canvas";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { GameDndProvider } from "@/components/game/game-dnd-provider";
import { useNavbar } from "@/components/layout/navbar-context";
import { useAuth } from "@/lib/auth-context";
import { serializeCommands } from "@/lib/game-engine/commands";

export default function PlayLevelPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = params.levelId as string;
  const { isAuthenticated } = useAuth();

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId),
  });

  const { data: level } = levelQuery;
  const { setLevelInfo } = useNavbar();
  const hasSavedProgress = useRef(false);
  const lastSavedProgramRef = useRef<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const programQuery = useQuery({
    queryKey: ["level", levelId, "program"],
    queryFn: () => getLevelProgram(levelId),
    enabled: isAuthenticated,
    retry: false,
  });

  const officialListQuery = useQuery({
    queryKey: ["levels", "official"],
    queryFn: getOfficialLevels,
    enabled: Boolean(level?.is_official),
  });

  const game = useGameState({
    mapData: level?.map,
    config: level?.config,
    initialCommands: programQuery.data ?? null,
    initialCommandsKey: levelId,
  });

  useEffect(() => {
    if (!level) return;
    setLevelInfo({ label: "Level", title: level.title });
    return () => setLevelInfo(null);
  }, [level, setLevelInfo]);

  useEffect(() => {
    if (!level || !game.didSucceed) {
      hasSavedProgress.current = false;
      return;
    }
    if (hasSavedProgress.current) return;
    if (!isAuthenticated) return;

    hasSavedProgress.current = true;
    const totalStars = level.map.stars.length;
    const bestSteps = game.execution?.totalSteps ?? game.execution?.finalState.steps ?? 0;

    updateLevelProgress(level.id, {
      is_completed: true,
      best_steps: bestSteps,
      stars_collected: totalStars,
    }).catch(() => {
      hasSavedProgress.current = false;
    });
  }, [level, game.didSucceed, game.execution, isAuthenticated]);

  useEffect(() => {
    if (!programQuery.data) return;
    lastSavedProgramRef.current = JSON.stringify({
      commands_f0: programQuery.data.commands_f0,
      commands_f1: programQuery.data.commands_f1,
      commands_f2: programQuery.data.commands_f2,
    });
  }, [programQuery.data]);

  const serializedProgram = useMemo(() => {
    return {
      commands_f0: serializeCommands(game.commandSet.f0),
      commands_f1: serializeCommands(game.commandSet.f1),
      commands_f2: serializeCommands(game.commandSet.f2),
    };
  }, [game.commandSet]);

  useEffect(() => {
    if (!isAuthenticated || !level) return;
    const hasCommands =
      serializedProgram.commands_f0.length > 0 ||
      serializedProgram.commands_f1.length > 0 ||
      serializedProgram.commands_f2.length > 0;
    const alreadySaved = lastSavedProgramRef.current === JSON.stringify(serializedProgram);
    if (!hasCommands && !programQuery.data) return;
    if (alreadySaved) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      updateLevelProgram(level.id, serializedProgram)
        .then(() => {
          lastSavedProgramRef.current = JSON.stringify(serializedProgram);
        })
        .catch(() => {
          // keep lastSavedProgramRef to allow retry on next change
        });
    }, 600);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [serializedProgram, isAuthenticated, level, programQuery.data]);

  const nextOfficialLevel = useMemo(() => {
    if (!level || !level.is_official || !officialListQuery.data) return null;
    const index = officialListQuery.data.findIndex((item) => item.id === level.id);
    if (index === -1) return null;
    return officialListQuery.data[index + 1] ?? null;
  }, [level, officialListQuery.data]);

  const backToLobbyUrl = level?.is_official
    ? "/levels?tab=official"
    : "/levels?tab=community";

  const nextButton = nextOfficialLevel ? (
    <button
      type="button"
      onClick={() => router.push(`/play/${nextOfficialLevel.id}`)}
      className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
    >
      下一關
    </button>
  ) : null;

  const backButton = (
    <button
      type="button"
      onClick={() => router.push(backToLobbyUrl)}
      className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
    >
      回關卡大廳
    </button>
  );

  const retryButton = (
    <button
      type="button"
      onClick={game.reset}
      className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
    >
      再試一次
    </button>
  );

  if (levelQuery.isLoading) {
    return <div className="p-6">載入關卡中...</div>;
  }

  if (levelQuery.isError || !level) {
    return <div className="p-6 text-red-500">關卡載入失敗</div>;
  }

  const currentState = game.currentState;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col gap-3 px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-[3] flex-col gap-3">
            <div className="flex min-h-0 flex-1 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
              <div className="relative flex min-h-0 flex-1 items-stretch">
                {game.didSucceed && (
                  <GameResultOverlay
                    title="通關完成"
                    description="已成功收集所有星星。"
                    tone="success"
                    primaryAction={nextButton ?? backButton}
                    secondaryAction={
                      <>
                        {nextButton ? backButton : null}
                        {retryButton}
                      </>
                    }
                  />
                )}
                <GameCanvas
                  mapData={level.map}
                  state={currentState}
                  fitToContainer
                />
                <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-900/10" />
              </div>
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
          </div>

          <div className="flex min-h-0 flex-[2] gap-3">
            <GameDndProvider
              onDropCommand={game.dropCommand}
              onDropCondition={game.dropCondition}
              disabled={game.isEditingLocked}
            >
              <div className="w-[clamp(180px,22vw,240px)] shrink-0">
                  <CommandToolbox
                    config={level.config}
                    activeCommand={game.selectedSlotState?.type ?? null}
                    activeCondition={game.selectedSlotState?.condition ?? null}
                    disabled={!game.selectedSlot || game.isEditingLocked}
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
                  disabled={game.isEditingLocked}
                />
                {currentState && currentState.status === "failure" && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {currentState.outOfBoundsPosition ? (
                      <div className="space-y-1">
                        <div className="font-semibold">🚨 火箭飛出有效範圍！</div>
                        <div>
                          越界位置：({currentState.outOfBoundsPosition.x},{" "}
                          {currentState.outOfBoundsPosition.y})
                        </div>
                        <div className="text-rose-600">{currentState.error}</div>
                      </div>
                    ) : (
                      currentState.error
                    )}
                  </div>
                )}
              </div>
            </GameDndProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
