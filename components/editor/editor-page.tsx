"use client";

/**
 * Block42 Frontend - Shared editor page logic
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { LevelConfig, MapData, Solution } from "@/types/api";
import { getLevelById } from "@/lib/api/levels";
import { createLevel, updateLevel, publishLevel } from "@/lib/api/designer";
import { toast } from "sonner";
import { ModeToggle } from "@/components/editor/mode-toggle";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { SettingsPanel } from "@/components/editor/settings-panel";
import { useGameState } from "@/lib/hooks/use-game-state";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { GameCanvas } from "@/components/game/game-canvas";
import { GameHUD } from "@/components/game/game-hud";

const DEFAULT_MAP: MapData = {
  start: { x: 0, y: 0, dir: 1 },
  stars: [],
  tiles: [{ x: 0, y: 0, color: "R" }],
};

const DEFAULT_CONFIG: LevelConfig = {
  f0: 10,
  f1: 0,
  f2: 0,
  tools: {
    paint_red: true,
    paint_green: false,
    paint_blue: false,
  },
};

interface EditorPageProps {
  levelId?: string;
}

export function EditorPage({ levelId }: EditorPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"edit" | "play">("edit");
  const [title, setTitle] = useState("未命名關卡");
  const [mapData, setMapData] = useState<MapData>(DEFAULT_MAP);
  const [config, setConfig] = useState<LevelConfig>(DEFAULT_CONFIG);
  const [tool, setTool] = useState<"paint" | "erase" | "start" | "star">("paint");
  const [paintColor, setPaintColor] = useState<"R" | "G" | "B">("R");

  const levelQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId as string),
    enabled: !!levelId,
  });

  useEffect(() => {
    if (levelQuery.data) {
      setTitle(levelQuery.data.title);
      setMapData(levelQuery.data.map);
      setConfig(levelQuery.data.config);
    }
  }, [levelQuery.data]);

  const createMutation = useMutation({
    mutationFn: createLevel,
    onSuccess: (created) => {
      toast.success("已建立關卡");
      router.push(`/studio/editor/${created.id}`);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "建立失敗");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: { title: string; map: MapData; config: LevelConfig } }) =>
      updateLevel(payload.id, payload.data),
    onSuccess: () => toast.success("已儲存變更"),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "儲存失敗");
    },
  });

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; data: { solution: Solution } }) =>
      publishLevel(payload.id, payload.data),
    onSuccess: () => toast.success("已送出審核"),
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "發布失敗");
    },
  });

  const game = useGameState({ mapData, config });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("請輸入關卡名稱");
      return;
    }
    if (!levelId) {
      createMutation.mutate({ title, map: mapData, config });
      return;
    }
    updateMutation.mutate({ id: levelId, data: { title, map: mapData, config } });
  };

  const handlePublish = () => {
    if (!levelId) {
      toast.error("請先儲存關卡");
      return;
    }
    if (!game.execution?.success) {
      toast.error("請先試玩通關");
      return;
    }
    publishMutation.mutate({ id: levelId, data: { solution: game.serializeSolution() } });
  };

  if (levelId && levelQuery.isLoading) {
    return <div className="p-6">載入關卡中...</div>;
  }

  if (levelId && levelQuery.isError) {
    return <div className="p-6 text-red-500">關卡載入失敗</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">關卡編輯器</h1>
            <p className="text-gray-600">建立或修改關卡內容。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-md bg-slate-800 px-4 py-2 text-sm text-white"
              onClick={handleSave}
            >
              儲存草稿
            </button>
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={handlePublish}
              disabled={!game.execution?.success}
            >
              提交發布
            </button>
          </div>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "edit" ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <EditorCanvas
              mapData={mapData}
              tool={tool}
              color={paintColor}
              onChange={setMapData}
            />
            <div className="space-y-4">
              <EditorToolbar
                tool={tool}
                color={paintColor}
                onToolChange={setTool}
                onColorChange={setPaintColor}
              />
              <SettingsPanel
                title={title}
                config={config}
                onTitleChange={setTitle}
                onConfigChange={setConfig}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border bg-slate-900/80">
              <GameHUD
                title={title}
                steps={game.currentState?.steps ?? 0}
                bestSteps={game.execution?.totalSteps ?? null}
                collectedStars={game.currentState?.collectedStars.size ?? 0}
                totalStars={mapData.stars.length}
                status={game.currentState?.status ?? "idle"}
              />
              <div className="h-[360px] px-4 pb-4">
                <GameCanvas mapData={mapData} state={game.currentState} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              <CommandToolbox
                config={config}
                activeCondition={game.condition}
                onConditionChange={game.setCondition}
                onAddCommand={(type) => game.addCommand(game.selectedTrack, type)}
              />
              <div className="space-y-3">
                <ProgrammingWorkspace
                  config={config}
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
        )}
      </div>
    </div>
  );
}
