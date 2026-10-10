"use client";

/**
 * Block42 Frontend - Fullscreen playtest modal
 * 作者在這裡解開自己的關卡；過關時把解法回報給編輯器，才能送出發布。
 */

import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import type { LevelConfig, MapData, Solution } from "@/types/api";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameWorkbench } from "@/components/game/game-workbench";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { Button } from "@/components/ui/button";

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
  const reportedRef = useRef(false);
  const { didSucceed, serializeSolution } = game;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!didSucceed) {
      reportedRef.current = false;
      return;
    }
    if (reportedRef.current) return;
    reportedRef.current = true;
    onSuccess(serializeSolution());
  }, [didSucceed, serializeSolution, onSuccess]);

  const passed = playtestPassed || didSucceed;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper" role="dialog" aria-modal="true" aria-label={`試玩：${title}`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="text-xs text-ink-faint">試玩</div>
          <div className="truncate font-semibold text-ink">{title}</div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            passed ? "bg-success/10 text-success" : "bg-paper-deep text-ink-soft"
          }`}
        >
          {passed && <Check className="h-3 w-3" strokeWidth={3} />}
          {passed ? "已解開" : "還沒解開"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right text-xs text-ink-faint sm:block">{!canPublish && publishHint}</div>
          <Button size="sm" onClick={onPublish} disabled={!canPublish}>
            送出發布
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-soft transition hover:bg-paper-deep hover:text-ink"
            aria-label="關閉試玩"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6">
          <GameWorkbench
            mapData={mapData}
            config={config}
            game={game}
            successOverlay={
              <GameResultOverlay
                title="解開了"
                description="這個解法會跟著關卡一起送出，伺服器會再驗證一次。"
                primaryAction={
                  canPublish ? <Button onClick={onPublish}>送出發布</Button> : undefined
                }
                secondaryAction={
                  <Button variant="outline" onClick={onClose}>
                    回到編輯
                  </Button>
                }
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
