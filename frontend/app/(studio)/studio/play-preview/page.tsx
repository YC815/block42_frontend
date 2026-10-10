"use client";

/**
 * Block42 Frontend - Play preview page (no account sync).
 * 從編輯器另開分頁試玩；過關後把解法傳回原本的編輯器分頁。
 */

import { useEffect, useState } from "react";
import type { LevelConfig, MapData } from "@/types/api";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameWorkbench } from "@/components/game/game-workbench";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { Button } from "@/components/ui/button";

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
      return { key: null, payload: null, error: "找不到試玩資料，請從編輯器重新開啟。" };
    }
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) {
      return { key, payload: null, error: "試玩資料已過期，請從編輯器重新開啟。" };
    }
    try {
      return { key, payload: JSON.parse(stored) as PreviewPayload, error: null };
    } catch {
      return { key, payload: null, error: "試玩資料格式錯誤。" };
    }
  });

  const game = useGameState({ mapData: payload?.map, config: payload?.config });
  const { didSucceed, serializeSolution } = game;

  useEffect(() => {
    if (!previewKey || !didSucceed) return;
    if (!window.opener || window.opener.closed) return;
    window.opener.postMessage(
      { type: "playtest-success", key: previewKey, solution: serializeSolution() },
      window.location.origin
    );
  }, [didSucceed, previewKey, serializeSolution]);

  if (error) {
    return <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-destructive">{error}</div>;
  }
  if (!payload) {
    return <div className="px-4 py-10 text-sm text-ink-soft">載入試玩資料中…</div>;
  }

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-4 sm:px-6">
      <header className="mb-4">
        <div className="text-xs text-ink-faint">試玩預覽</div>
        <h1 className="text-lg font-bold text-ink">{payload.title}</h1>
      </header>
      <GameWorkbench
        mapData={payload.map}
        config={payload.config}
        game={game}
        successOverlay={
          <GameResultOverlay
            title="解開了"
            description="解法已傳回編輯器，回到編輯器分頁就能送出發布。"
            secondaryAction={
              <Button variant="outline" onClick={game.reset}>
                再玩一次
              </Button>
            }
          />
        }
      />
    </div>
  );
}
