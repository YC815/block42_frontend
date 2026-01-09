"use client";

/**
 * Block42 Frontend - Play preview page (no account sync).
 */

import { useEffect, useState } from "react";
import type { LevelConfig, MapData } from "@/types/api";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameCanvas } from "@/components/game/game-canvas";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { GameDndProvider } from "@/components/game/game-dnd-provider";
import { useNavbar } from "@/components/layout/navbar-context";

interface PreviewPayload {
  title: string;
  map: MapData;
  config: LevelConfig;
}

const STORAGE_PREFIX = "block42:play-preview:";

export default function PlayPreviewPage() {
  const [{ key: previewKey, payload, error }] = useState(() => {
    if (typeof window === "undefined") {
      return { key: null as string | null, payload: null as PreviewPayload | null, error: null as string | null };
    }
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");
    if (!key) {
      return { key: null, payload: null, error: "找不到預覽代碼" };
    }
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) {
      return { key, payload: null, error: "預覽資料已過期或不存在" };
    }
    try {
      const parsed = JSON.parse(stored) as PreviewPayload;
      return { key, payload: parsed, error: null };
    } catch {
      return { key, payload: null, error: "預覽資料格式錯誤" };
    }
  });
  const { setLevelInfo } = useNavbar();

  const game = useGameState({
    mapData: payload?.map,
    config: payload?.config,
  });

  const { didSucceed, serializeSolution } = game;

  useEffect(() => {
    if (!previewKey || !didSucceed) return;
    if (!window.opener || window.opener.closed) return;
    window.opener.postMessage(
      {
        type: "playtest-success",
        key: previewKey,
        solution: serializeSolution(),
      },
      window.location.origin
    );
  }, [didSucceed, previewKey, serializeSolution]);

  useEffect(() => {
    if (!payload) return;
    setLevelInfo({ label: "Level", title: payload.title });
    return () => setLevelInfo(null);
  }, [payload, setLevelInfo]);

  if (error) {
    return <div className="p-6 text-rose-600">{error}</div>;
  }

  if (!payload) {
    return <div className="p-6">載入試玩資料中...</div>;
  }

  const currentState = game.currentState;
  const queueSnapshot =
    game.queueSnapshots[
      Math.min(game.timelineIndex, Math.max(0, game.queueSnapshots.length - 1))
    ] ??
    [];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.18),transparent_40%),linear-gradient(180deg,#f8fafc,#e2e8f0)]">
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
                    secondaryAction={
                      <button
                        type="button"
                        onClick={game.reset}
                        className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
                      >
                        再試一次
                      </button>
                    }
                  />
                )}
                <GameCanvas
                  mapData={payload.map}
                  state={currentState}
                  fitToContainer
                />
                <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-900/10" />
              </div>
            </div>
            <ExecutionThreadBar
              queue={queueSnapshot}
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
                    config={payload.config}
                    activeCommand={game.selectedSlotState?.type ?? null}
                    activeCondition={game.selectedSlotState?.condition ?? null}
                    disabled={!game.selectedSlot || game.isEditingLocked}
                    onSelectCommand={game.applyCommand}
                    onSelectCondition={game.applyCondition}
                  />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <ProgrammingWorkspace
                  config={payload.config}
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
