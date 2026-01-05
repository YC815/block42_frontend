"use client";

/**
 * Block42 Frontend - Play Level Page
 */

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getLevelById } from "@/lib/api/levels";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameCanvas } from "@/components/game/game-canvas";
import { GameHUD } from "@/components/game/game-hud";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";

export default function PlayLevelPage() {
  const params = useParams();
  const levelId = params.levelId as string;

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId),
  });

  const { data: level } = levelQuery;

  const game = useGameState({
    mapData: level?.map,
    config: level?.config,
  });

  if (levelQuery.isLoading) {
    return <div className="p-6">載入關卡中...</div>;
  }

  if (levelQuery.isError || !level) {
    return <div className="p-6 text-red-500">關卡載入失敗</div>;
  }

  const currentState = game.currentState;
  const status = currentState?.status || "idle";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex h-[55%] flex-col">
        <GameHUD
          title={level.title}
          steps={currentState?.steps ?? 0}
          bestSteps={null}
          collectedStars={currentState?.collectedStars.size ?? 0}
          totalStars={level.map.stars.length}
          status={status}
        />
        <div className="flex-1 px-4 pb-4">
          <div className="h-full rounded-2xl border bg-slate-900/80">
            <GameCanvas mapData={level.map} state={currentState} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 bg-gray-50 px-4 py-4">
        <div className="w-[35%] min-w-[260px]">
          <CommandToolbox
            config={level.config}
            activeCondition={game.condition}
            onConditionChange={game.setCondition}
            onAddCommand={(type) => game.addCommand(game.selectedTrack, type)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <ProgrammingWorkspace
            config={level.config}
            commandSet={game.commandSet}
            selectedTrack={game.selectedTrack}
            onSelectTrack={game.setSelectedTrack}
            onRemoveCommand={game.removeCommand}
            onClearTrack={game.clearTrack}
          />
          <GameControls
            isRunning={game.isRunning}
            speed={game.speed}
            onRun={game.run}
            onStep={game.step}
            onReset={game.reset}
            onSpeedChange={game.setSpeed}
          />
          {game.execution?.finalState.status === "failure" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {game.execution.finalState.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
