"use client";

/**
 * Block42 Frontend - 教學
 * 兩個有導覽的小練習（學操作），加上四個示範（認識每一種指令）。
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameCanvas } from "@/components/game/game-canvas";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { GameWorkbench } from "@/components/game/game-workbench";
import { CommandChip } from "@/components/game/game-icons";
import { TutorialTour } from "@/components/tutorial/tutorial-tour";
import { stepDurationFor, useGameState } from "@/lib/hooks/use-game-state";
import { TUTORIAL_LEVELS, type TutorialLevelDefinition } from "@/lib/tutorial/levels";
import { parseCommands } from "@/lib/game-engine/simulator";

const INTERACTIVE_LEVELS = TUTORIAL_LEVELS.filter((level) => !level.sampleProgram);

type TabKey = "level-0" | "level-1" | "showcase";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "level-0", label: INTERACTIVE_LEVELS[0].title },
  { key: "level-1", label: INTERACTIVE_LEVELS[1].title },
  { key: "showcase", label: "認識指令" },
];

type ShowcaseDemo = {
  id: string;
  title: string;
  description: string;
  map: TutorialLevelDefinition["map"];
  config: TutorialLevelDefinition["config"];
  program: { commands_f0: string[]; commands_f1: string[]; commands_f2: string[] };
  notes: string[];
};

const NO_TOOLS = { paint_red: false, paint_green: false, paint_blue: false };

const SHOWCASE_DEMOS: ShowcaseDemo[] = [
  {
    id: "move-turn",
    title: "前進與轉彎",
    description: "前進一格、左轉、再前進一格，就能繞過轉角。",
    map: {
      start: { x: 0, y: 1, dir: 1 },
      stars: [{ x: 1, y: 0 }],
      tiles: [
        { x: 0, y: 1, color: "R" },
        { x: 1, y: 1, color: "R" },
        { x: 1, y: 0, color: "R" },
      ],
    },
    config: { f0: 3, f1: 0, f2: 0, tools: NO_TOOLS },
    program: { commands_f0: ["move", "turn_left", "move"], commands_f1: [], commands_f2: [] },
    notes: [
      "前進：往機器人面向的方向走一格。",
      "左轉、右轉：原地轉 90 度，不會移動。",
    ],
  },
  {
    id: "condition",
    title: "顏色條件",
    description: "第二個前進只在藍色地板上才會做。",
    map: {
      start: { x: 0, y: 0, dir: 1 },
      stars: [{ x: 2, y: 0 }],
      tiles: [
        { x: 0, y: 0, color: "R" },
        { x: 1, y: 0, color: "B" },
        { x: 2, y: 0, color: "R" },
      ],
    },
    config: { f0: 3, f1: 0, f2: 0, tools: NO_TOOLS },
    program: { commands_f0: ["move", "move:B"], commands_f1: [], commands_f2: [] },
    notes: [
      "有底色的指令只在同色地板上執行，其他時候會被跳過。",
      "被跳過的指令一樣算一步。",
    ],
  },
  {
    id: "paint",
    title: "塗色",
    description: "先把腳下塗成藍色，接下來的藍色條件就會成立。",
    map: {
      start: { x: 0, y: 0, dir: 1 },
      stars: [{ x: 1, y: 0 }],
      tiles: [
        { x: 0, y: 0, color: "R" },
        { x: 1, y: 0, color: "R" },
      ],
    },
    config: { f0: 2, f1: 0, f2: 0, tools: { paint_red: false, paint_green: false, paint_blue: true } },
    program: { commands_f0: ["paint_blue", "move:B"], commands_f1: [], commands_f2: [] },
    notes: [
      "塗色會改變機器人腳下那一格的顏色。",
      "之後的顏色條件，看的是塗過之後的顏色。",
    ],
  },
  {
    id: "functions",
    title: "函式與遞迴",
    description: "F1 是一階樓梯，F0 呼叫 F1 之後再呼叫自己，就會一直爬下去。",
    map: {
      start: { x: 0, y: 3, dir: 1 },
      stars: [{ x: 3, y: 0 }],
      tiles: [
        { x: 0, y: 3, color: "R" },
        { x: 1, y: 3, color: "R" },
        { x: 1, y: 2, color: "R" },
        { x: 2, y: 2, color: "R" },
        { x: 2, y: 1, color: "R" },
        { x: 3, y: 1, color: "R" },
        { x: 3, y: 0, color: "R" },
      ],
    },
    config: { f0: 2, f1: 4, f2: 0, tools: NO_TOOLS },
    program: {
      commands_f0: ["f1", "f0"],
      commands_f1: ["move", "turn_left", "move", "turn_right"],
      commands_f2: [],
    },
    notes: [
      "呼叫函式：先把那個函式裡的指令全部做完，再回來繼續。",
      "函式可以呼叫自己（遞迴）。拿到所有星星時，程式會自動停止。",
    ],
  },
];

function ProgramPreview({ program }: { program: ShowcaseDemo["program"] }) {
  const tracks = (["f0", "f1", "f2"] as const)
    .map((key) => ({ key, commands: parseCommands(program[`commands_${key}`]) }))
    .filter((track) => track.commands.length > 0);
  return (
    <div className="space-y-2">
      {tracks.map((track) => (
        <div key={track.key} className="flex items-center gap-2">
          <span className="w-7 rounded-md bg-ink py-0.5 text-center font-mono text-xs font-bold text-white">
            {track.key.toUpperCase()}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {track.commands.map((command, index) => (
              <CommandChip key={index} type={command.type} condition={command.condition} size="sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShowcaseCard({ demo }: { demo: ShowcaseDemo }) {
  const game = useGameState({
    mapData: demo.map,
    config: demo.config,
    initialCommands: demo.program,
    initialCommandsKey: demo.id,
  });

  return (
    <article className="grid gap-4 rounded-2xl border border-line bg-white p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="h-56 rounded-xl bg-grid-paper p-2">
        <GameCanvas
          mapData={demo.map}
          state={game.currentState}
          fitToContainer
          stepDurationMs={stepDurationFor(game.speed)}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h3 className="font-semibold text-ink">{demo.title}</h3>
          <p className="mt-1 text-sm text-ink-soft">{demo.description}</p>
        </div>
        <ProgramPreview program={demo.program} />
        <ul className="space-y-1 text-sm text-ink-soft">
          {demo.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
              {note}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center gap-2">
          <Button size="sm" onClick={game.run} disabled={game.isRunning}>
            <Play className="h-3.5 w-3.5 fill-current" />
            播放
          </Button>
          <Button size="sm" variant="outline" onClick={game.reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            重來
          </Button>
        </div>
        <ExecutionThreadBar queueSnapshots={game.queueSnapshots} timelineIndex={game.timelineIndex} embedded />
      </div>
    </article>
  );
}

type TourState = "open" | "dismissed" | "completed";

function InteractivePane({
  level,
  onComplete,
  onNext,
}: {
  level: TutorialLevelDefinition;
  onComplete: (levelId: string) => void;
  onNext: () => void;
}) {
  const [tourState, setTourState] = useState<TourState>("open");
  const game = useGameState({ mapData: level.map, config: level.config });
  const { didSucceed } = game;
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!didSucceed || reportedRef.current) return;
    reportedRef.current = true;
    onComplete(level.id);
  }, [didSucceed, level.id, onComplete]);

  return (
    <>
      <GameWorkbench
        mapData={level.map}
        config={level.config}
        game={game}
        boardClassName="h-[clamp(240px,40vh,420px)]"
        aside={
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm font-semibold text-ink">{level.goal}</p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-ink-soft">
              {level.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
            {level.tour.length > 0 && (
              <button
                type="button"
                onClick={() => setTourState("open")}
                className="mt-3 text-xs font-medium text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                重新看一次導覽
              </button>
            )}
          </div>
        }
        successOverlay={
          <GameResultOverlay
            title="完成！"
            description="你已經會放指令和執行了。"
            primaryAction={
              <Button onClick={onNext}>
                下一步
                <ChevronRight className="h-4 w-4" />
              </Button>
            }
            secondaryAction={
              <Button variant="outline" onClick={game.reset}>
                再玩一次
              </Button>
            }
          />
        }
      />
      {tourState === "open" && level.tour.length > 0 && (
        <TutorialTour
          steps={level.tour}
          onClose={() => setTourState("dismissed")}
          onComplete={() => setTourState("completed")}
        />
      )}
    </>
  );
}

export default function TutorialPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("level-0");
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleComplete = (levelId: string) => {
    setCompleted((prev) => new Set(prev).add(levelId));
  };

  const activeIndex = selectedTab === "level-0" ? 0 : selectedTab === "level-1" ? 1 : null;

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6" data-tour-id="tutorial-page">
      <h1 className="text-2xl font-bold text-ink">教學</h1>
      <p className="mt-1 text-sm text-ink-soft">先用兩個小練習學會操作，再看看每一種指令怎麼用。</p>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((tab, index) => {
          const level = index < 2 ? INTERACTIVE_LEVELS[index] : null;
          const done = level ? completed.has(level.id) : false;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selectedTab === tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                selectedTab === tab.key
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink-soft hover:text-ink"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  done ? "bg-success text-white" : selectedTab === tab.key ? "bg-white/20" : "bg-paper-deep"
                }`}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {activeIndex !== null ? (
          <InteractivePane
            key={INTERACTIVE_LEVELS[activeIndex].id}
            level={INTERACTIVE_LEVELS[activeIndex]}
            onComplete={handleComplete}
            onNext={() => setSelectedTab(activeIndex === 0 ? "level-1" : "showcase")}
          />
        ) : (
          <div className="space-y-4">
            {SHOWCASE_DEMOS.map((demo) => (
              <ShowcaseCard key={demo.id} demo={demo} />
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
              <div>
                <div className="font-semibold text-ink">準備好了</div>
                <div className="mt-0.5 text-sm text-ink-soft">官方關卡會從最簡單的開始，一章學一個概念。</div>
              </div>
              <Button asChild>
                <Link href="/play/official-01">
                  開始第 1 關
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
