"use client";

/**
 * Block42 Frontend - Play Level Page
 * 官方關卡讀程式內建資料；社群關卡從 API 載入。
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Lightbulb } from "lucide-react";
import {
  completeLevel,
  getLevelById,
  getLevelProgram,
  updateLevelProgram,
} from "@/lib/api/levels";
import {
  OFFICIAL_CHAPTERS,
  getNextOfficialLevel,
  getOfficialLevel,
} from "@/lib/levels/official";
import { useGameState } from "@/lib/hooks/use-game-state";
import { GameWorkbench } from "@/components/game/game-workbench";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { useAuth } from "@/lib/auth-context";
import { serializeCommands } from "@/lib/game-engine/commands";
import { Button } from "@/components/ui/button";

export default function PlayLevelPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const levelId = params?.levelId as string;
  const { isAuthenticated } = useAuth();
  const official = getOfficialLevel(levelId);

  const communityQuery = useQuery({
    queryKey: ["level", levelId],
    queryFn: () => getLevelById(levelId),
    enabled: !official,
  });

  const level = official ?? communityQuery.data;
  const hasSavedProgress = useRef(false);
  const lastSavedProgramRef = useRef<string | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const programQuery = useQuery({
    queryKey: ["level", levelId, "program"],
    queryFn: () => getLevelProgram(levelId),
    enabled: isAuthenticated,
    retry: false,
  });

  const game = useGameState({
    mapData: level?.map,
    config: level?.config,
    initialCommands: programQuery.data ?? null,
    initialCommandsKey: levelId,
  });

  const serializedProgram = useMemo(
    () => ({
      commands_f0: serializeCommands(game.commandSet.f0),
      commands_f1: serializeCommands(game.commandSet.f1),
      commands_f2: serializeCommands(game.commandSet.f2),
    }),
    [game.commandSet]
  );

  // 過關後把程式交給伺服器確認，記錄進度
  useEffect(() => {
    if (!level || !game.didSucceed) {
      hasSavedProgress.current = false;
      return;
    }
    if (hasSavedProgress.current || !isAuthenticated) return;
    hasSavedProgress.current = true;
    completeLevel(level.id, serializedProgram)
      .then(() => {
        setSaveError(null);
        queryClient.invalidateQueries({ queryKey: ["levels", "progress"] });
      })
      .catch((error: Error) => {
        hasSavedProgress.current = false;
        setSaveError(error.message);
      });
  }, [level, game.didSucceed, isAuthenticated, serializedProgram, queryClient]);

  useEffect(() => {
    if (!programQuery.data) return;
    lastSavedProgramRef.current = JSON.stringify({
      commands_f0: programQuery.data.commands_f0,
      commands_f1: programQuery.data.commands_f1,
      commands_f2: programQuery.data.commands_f2,
    });
  }, [programQuery.data]);

  // 自動存檔（停止編輯 0.6 秒後）
  useEffect(() => {
    if (!isAuthenticated || !level) return;
    const hasCommands = Object.values(serializedProgram).some((list) => list.length > 0);
    if (!hasCommands && !programQuery.data) return;
    if (lastSavedProgramRef.current === JSON.stringify(serializedProgram)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateLevelProgram(level.id, serializedProgram)
        .then(() => {
          lastSavedProgramRef.current = JSON.stringify(serializedProgram);
        })
        .catch(() => {
          // 下次修改時再試
        });
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [serializedProgram, isAuthenticated, level, programQuery.data]);

  if (!official && communityQuery.isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-soft">載入關卡中…</div>;
  }

  if (!level) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-bold text-ink">找不到這個關卡</h1>
        <p className="mt-2 text-sm text-ink-soft">可能已被作者刪除，或網址打錯了。</p>
        <Button asChild className="mt-6">
          <Link href="/levels">回關卡列表</Link>
        </Button>
      </div>
    );
  }

  const nextLevel = official ? getNextOfficialLevel(official.id) : undefined;
  const chapter = official
    ? OFFICIAL_CHAPTERS.find((item) => item.id === official.chapter_id)
    : undefined;
  const backHref = official ? "/levels" : "/levels?tab=community";
  const steps = game.execution?.totalSteps ?? 0;

  const successOverlay = (
    <GameResultOverlay
      title="過關！"
      description={
        <>
          用了 {steps} 步收齊所有星星。
          {!isAuthenticated && (
            <span className="mt-1 block text-xs text-ink-faint">登入後才會記錄進度。</span>
          )}
          {saveError && (
            <span className="mt-1 block text-xs text-destructive">進度沒有存到：{saveError}</span>
          )}
        </>
      }
      primaryAction={
        nextLevel ? (
          <Button onClick={() => router.push(`/play/${nextLevel.id}`)}>
            下一關
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={() => router.push(backHref)}>回關卡列表</Button>
        )
      }
      secondaryAction={
        <Button variant="outline" onClick={game.reset}>
          再玩一次
        </Button>
      }
    />
  );

  const aside = official ? (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm leading-relaxed text-ink">{official.goal}</p>
      <button
        type="button"
        onClick={() => setShowHint((value) => !value)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft transition hover:text-ink"
        aria-expanded={showHint}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {showHint ? "收起提示" : "需要提示"}
      </button>
      {showHint && (
        <p className="animate-rise-in mt-2 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-ink-soft">
          {official.hint}
        </p>
      )}
    </div>
  ) : (
    <div className="rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
      收集所有星星就過關。
    </div>
  );

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-4 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-ink-soft transition hover:bg-paper-deep hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          關卡列表
        </Link>
        <h1 className="flex items-baseline gap-2 text-lg font-bold text-ink sm:text-xl">
          {official && (
            <span className="font-mono text-sm font-semibold text-ink-faint">{official.number}</span>
          )}
          {level.title}
        </h1>
        <span className="text-xs text-ink-faint">
          {chapter
            ? `第 ${OFFICIAL_CHAPTERS.indexOf(chapter) + 1} 章・${chapter.title}`
            : communityQuery.data?.author_name
              ? `作者 ${communityQuery.data.author_name}`
              : null}
        </span>
      </header>

      <GameWorkbench
        mapData={level.map}
        config={level.config}
        game={game}
        aside={aside}
        successOverlay={successOverlay}
      />
    </div>
  );
}
