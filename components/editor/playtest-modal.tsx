"use client";

/**
 * Block42 Frontend - Fullscreen playtest modal
 */

import { useEffect, useMemo, useState } from "react";
import { XIcon } from "lucide-react";
import type { LevelConfig, MapData, Solution } from "@/types/api";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameCanvas } from "@/components/game/game-canvas";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { GameControls } from "@/components/game/game-controls";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameResultOverlay } from "@/components/game/game-result-overlay";

interface PlaytestModalProps {
  title: string;
  mapData: MapData;
  config: LevelConfig;
  canPublish: boolean;
  publishHint: string;
  playtestPassed: boolean;
  onClose: () => void;
  onPublish: () => void;
  onSuccess: (solution: Solution) => void;
}

export function PlaytestModal({
  title,
  mapData,
  config,
  canPublish,
  publishHint,
  playtestPassed,
  onClose,
  onPublish,
  onSuccess,
}: PlaytestModalProps) {
  const game = useGameState({ mapData, config });
  const [reportedSuccess, setReportedSuccess] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!game.didSucceed || reportedSuccess) return;
    setReportedSuccess(true);
    onSuccess(game.serializeSolution());
  }, [game.didSucceed, game.serializeSolution, onSuccess, reportedSuccess]);

  useEffect(() => {
    setReportedSuccess(false);
    setShowResult(false);
  }, [mapData, config]);

  useEffect(() => {
    if (!game.didSucceed) return;
    setShowResult(true);
  }, [game.didSucceed]);

  useEffect(() => {
    if (game.didSucceed) return;
    setShowResult(false);
  }, [game.didSucceed]);

  const queueSnapshot = useMemo(
    () =>
      game.queueSnapshots[
        Math.min(game.timelineIndex, Math.max(0, game.queueSnapshots.length - 1))
      ] ?? [],
    [game.queueSnapshots, game.timelineIndex]
  );

  const currentState = game.currentState;
  const resolvedPassed = playtestPassed || game.didSucceed;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_18%_20%,rgba(250,204,21,0.18),transparent_40%),linear-gradient(180deg,#f8fafc,#e2e8f0)]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-white/70 bg-white/85 px-6 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)] backdrop-blur">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Level
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          aria-label="關閉試玩視窗"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="relative mx-auto flex h-full max-w-[1400px] flex-col gap-4 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/70 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Playtest
              </span>
              <span
                className={`text-sm font-semibold ${
                  resolvedPassed ? "text-emerald-600" : "text-slate-600"
                }`}
              >
                {resolvedPassed ? "已通過" : "尚未通過"}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <button
                type="button"
                onClick={onPublish}
                disabled={!canPublish}
                className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                提交發布
              </button>
              {!canPublish && (
                <span className="text-xs text-slate-400">{publishHint}</span>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex min-h-0 flex-[3] flex-col gap-3">
              <div className="flex min-h-0 flex-1 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
                <div className="relative flex min-h-0 flex-1 items-stretch">
                  {showResult && game.didSucceed && (
                    <GameResultOverlay
                      title="通關完成"
                      description="已成功收集所有星星，可以直接提交發布。"
                      tone="success"
                      primaryAction={
                        <button
                          type="button"
                          onClick={onPublish}
                          disabled={!canPublish}
                          className="rounded-full bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          提交發布
                        </button>
                      }
                      secondaryAction={
                        <button
                          type="button"
                          onClick={() => setShowResult(false)}
                          className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
                        >
                          繼續試玩
                        </button>
                      }
                    />
                  )}
                  <GameCanvas
                    mapData={mapData}
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
              <div className="w-[clamp(180px,22vw,240px)] shrink-0">
                <CommandToolbox
                  config={config}
                  activeCommand={game.selectedSlotState?.type ?? null}
                  activeCondition={game.selectedSlotState?.condition ?? null}
                  disabled={!game.selectedSlot || game.isEditingLocked}
                  onSelectCommand={game.applyCommand}
                  onSelectCondition={game.applyCondition}
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <ProgrammingWorkspace
                  config={config}
                  slots={game.slots}
                  selectedSlot={game.selectedSlot}
                  onSelectSlot={game.selectSlot}
                  onClearTrack={game.clearTrack}
                  disabled={game.isEditingLocked}
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
    </div>
  );
}
