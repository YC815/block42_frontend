"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { getCommunityLevels, getLevelProgress } from "@/lib/api/levels";
import {
  CHAPTER_INTRO,
  OFFICIAL_CHAPTERS,
  OFFICIAL_LEVELS,
  getChapterLevels,
  type OfficialLevel,
} from "@/lib/levels/official";
import { MapThumbnail } from "@/components/levels/map-thumbnail";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import type { LevelListItem } from "@/types/api";

type Tab = "official" | "community";

export function LevelsPageClient() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: Tab = searchParams?.get("tab") === "community" ? "community" : "official";

  const progressQuery = useQuery({
    queryKey: ["levels", "progress"],
    queryFn: getLevelProgress,
    enabled: isAuthenticated,
  });

  const completed = useMemo(
    () => new Set(progressQuery.data?.filter((p) => p.is_completed).map((p) => p.level_id)),
    [progressQuery.data]
  );

  const setTab = (tab: Tab) => {
    router.replace(tab === "community" ? "/levels?tab=community" : "/levels", { scroll: false });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">關卡</h1>
          <p className="mt-1 text-sm text-ink-soft">
            官方關卡由淺入深共 {OFFICIAL_LEVELS.length} 關；社群關卡由其他玩家設計。
          </p>
        </div>
        <div className="flex rounded-xl border border-line bg-white p-1" role="tablist">
          {(
            [
              ["official", "官方關卡"],
              ["community", "社群關卡"],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                activeTab === tab ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "official" ? (
        <OfficialLevels completed={completed} isAuthenticated={isAuthenticated} />
      ) : (
        <CommunityLevels completed={completed} />
      )}
    </div>
  );
}

function OfficialLevels({
  completed,
  isAuthenticated,
}: {
  completed: Set<string>;
  isAuthenticated: boolean;
}) {
  const doneCount = OFFICIAL_LEVELS.filter((level) => completed.has(level.id)).length;
  const nextLevel = OFFICIAL_LEVELS.find((level) => !completed.has(level.id));

  return (
    <div className="mt-6 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
        <div className="min-w-0">
          {isAuthenticated ? (
            <>
              <div className="text-sm font-semibold text-ink">
                已完成 {doneCount} / {OFFICIAL_LEVELS.length} 關
              </div>
              <div className="mt-2 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-paper-deep">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${(doneCount / OFFICIAL_LEVELS.length) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-soft">
              不用登入也能玩。
              <Link href="/login?returnUrl=/levels" className="font-medium text-ink underline underline-offset-4">
                登入
              </Link>
              後會記錄你的進度和程式。
            </div>
          )}
        </div>
        {nextLevel && (
          <Button asChild>
            <Link href={`/play/${nextLevel.id}`}>
              {doneCount === 0 ? "從第一關開始" : `繼續 ${nextLevel.number} ${nextLevel.title}`}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {OFFICIAL_CHAPTERS.map((chapter, index) => {
        const levels = getChapterLevels(chapter.id);
        const chapterDone = levels.filter((level) => completed.has(level.id)).length;
        return (
          <section key={chapter.id} aria-labelledby={`${chapter.id}-title`}>
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`${chapter.id}-title`} className="text-lg font-bold text-ink">
                <span className="mr-2 text-ink-faint">第 {index + 1} 章</span>
                {chapter.title}
              </h2>
              <p className="text-sm text-ink-soft">{CHAPTER_INTRO[chapter.id]}</p>
              {isAuthenticated && (
                <span className="ml-auto text-xs tabular-nums text-ink-faint">
                  {chapterDone}/{levels.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {levels.map((level) => (
                <OfficialLevelCard key={level.id} level={level} done={completed.has(level.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function OfficialLevelCard({ level, done }: { level: OfficialLevel; done: boolean }) {
  return (
    <Link
      href={`/play/${level.id}`}
      className="group relative flex flex-col rounded-xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md hover:shadow-ink/5"
    >
      <div className="flex aspect-square items-center justify-center rounded-lg bg-paper p-2">
        <MapThumbnail map={level.map} className="h-full w-full" />
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-xs text-ink-faint">{level.number}</span>
        <span className="truncate text-sm font-semibold text-ink">{level.title}</span>
      </div>
      {done && (
        <span
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white"
          aria-label="已完成"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}
    </Link>
  );
}

function CommunityLevels({ completed }: { completed: Set<string> }) {
  const query = useQuery({ queryKey: ["levels", "community"], queryFn: getCommunityLevels });

  if (query.isLoading) {
    return <p className="mt-8 text-sm text-ink-soft">載入中…</p>;
  }
  if (query.isError) {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-white p-6 text-sm">
        <p className="font-semibold text-ink">社群關卡載入失敗</p>
        <p className="mt-1 text-ink-soft">可能是網路或伺服器暫時有問題。</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>
          重新載入
        </Button>
      </div>
    );
  }
  const levels = query.data ?? [];
  if (levels.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="font-semibold text-ink">還沒有社群關卡</p>
        <p className="mt-1 text-sm text-ink-soft">到創作工作室設計一關，審核通過後就會出現在這裡。</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/studio">前往創作工作室</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {levels.map((level) => (
        <CommunityLevelCard key={level.id} level={level} done={completed.has(level.id)} />
      ))}
    </div>
  );
}

function CommunityLevelCard({ level, done }: { level: LevelListItem; done: boolean }) {
  return (
    <Link
      href={`/play/${level.id}`}
      className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition hover:border-ink/30 hover:shadow-md hover:shadow-ink/5"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-ink">{level.title}</div>
        <div className="mt-1 text-xs text-ink-faint">
          {level.author_name ?? "匿名"}・{formatDate(level.created_at)}
        </div>
      </div>
      {done ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
          <Check className="h-3 w-3" strokeWidth={3} />
          已完成
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-ink-faint" />
      )}
    </Link>
  );
}
