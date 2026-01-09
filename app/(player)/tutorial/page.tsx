"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExecutionThreadBar } from "@/components/game/execution-thread";
import { GameCanvas } from "@/components/game/game-canvas";
import { GameControls } from "@/components/game/game-controls";
import { ProgrammingWorkspace } from "@/components/game/programming-workspace";
import { CommandToolbox } from "@/components/game/command-toolbox";
import { GameResultOverlay } from "@/components/game/game-result-overlay";
import { GameDndProvider } from "@/components/game/game-dnd-provider";
import { TutorialTour } from "@/components/tutorial/tutorial-tour";
import { useGameState } from "@/lib/hooks/use-game-state";
import type { CommandSlot, SlotSet } from "@/lib/hooks/use-game-state";
import { useNavbar } from "@/components/layout/navbar-context";
import { TUTORIAL_LEVELS, type TutorialLevelDefinition } from "@/lib/tutorial/levels";
import { parseCommands } from "@/lib/game-engine/simulator";
import type { CommandType, TileColor } from "@/types/api";

const COMMAND_LABELS: Record<CommandType, string> = {
  move: "向前",
  turn_left: "左轉",
  turn_right: "右轉",
  paint_red: "噴紅",
  paint_green: "噴綠",
  paint_blue: "噴藍",
  f0: "呼叫 f0",
  f1: "呼叫 f1",
  f2: "呼叫 f2",
};

const COLOR_LABELS: Record<TileColor, string> = {
  R: "紅色",
  G: "綠色",
  B: "藍色",
};

const INTERACTIVE_LEVELS = TUTORIAL_LEVELS.filter((level) => !level.sampleProgram);
const DEMO_LEVEL = TUTORIAL_LEVELS.find((level) => level.sampleProgram) ?? null;

type TabKey = "level-0" | "level-1" | "showcase";

const TABS: Array<{ key: TabKey; label: string; type: "interactive" | "showcase"; levelIndex?: number }> = [
  { key: "level-0", label: "練習編碼", type: "interactive", levelIndex: 0 },
  { key: "level-1", label: "熟悉編碼", type: "interactive", levelIndex: 1 },
  { key: "showcase", label: "認識積木", type: "showcase" },
];

function parseCommandString(command: string): { type: CommandType; condition?: TileColor } {
  const [type, condition] = command.split(":");
  return { type: type as CommandType, condition: condition as TileColor | undefined };
}

type ShowcaseDemo = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  map: TutorialLevelDefinition["map"];
  config: TutorialLevelDefinition["config"];
  program: {
    commands_f0: string[];
    commands_f1: string[];
    commands_f2: string[];
  };
  notes: string[];
};

const SHOWCASE_DEMOS: ShowcaseDemo[] = [
  {
    id: "blocks-move-turn",
    title: "移動與轉向",
    subtitle: "Move / Turn Left / Turn Right",
    description: "最基本的移動積木，先前進再轉向，再前進抵達星星。",
    tags: ["Move", "Turn Left/Right"],
    map: {
      start: { x: 0, y: 1, dir: 1 },
      stars: [{ x: 1, y: 0 }],
      tiles: [
        { x: 0, y: 1, color: "R" },
        { x: 1, y: 1, color: "R" },
        { x: 1, y: 0, color: "R" },
      ],
    },
    config: {
      f0: 5,
      f1: 0,
      f2: 0,
      tools: { paint_red: false, paint_green: false, paint_blue: false },
    },
    program: {
      commands_f0: ["move", "turn_left", "move"],
      commands_f1: [],
      commands_f2: [],
    },
    notes: [
      "向前 (move) 會依照當前朝向走一步。",
      "轉向只改變方向，不會移動位置。",
      "組合 move → turn_left → move，就能轉彎去拿星星。",
    ],
  },
  {
    id: "blocks-condition",
    title: "條件判斷",
    subtitle: "Condition on tile color",
    description: "在紅色地板才前進，避免衝向藍色終點。",
    tags: ["Condition"],
    map: {
      start: { x: 0, y: 0, dir: 1 },
      stars: [{ x: 2, y: 0 }],
      tiles: [
        { x: 0, y: 0, color: "R" },
        { x: 1, y: 0, color: "R" },
        { x: 2, y: 0, color: "B" },
      ],
    },
    config: {
      f0: 4,
      f1: 0,
      f2: 0,
      tools: { paint_red: false, paint_green: false, paint_blue: false },
    },
    program: {
      commands_f0: ["move", "move:B", "move"],
      commands_f1: [],
      commands_f2: [],
    },
    notes: [
      "第三步加上藍色條件，只有站在藍色地板時才會執行。",
      "站在紅色時，帶條件的指令會被跳過且不耗步數。",
      "利用條件可以避免掉落或撞牆，讓流程更安全。",
    ],
  },
  {
    id: "blocks-brush",
    title: "筆刷與條件",
    subtitle: "Paint + Condition",
    description: "先把起點噴成藍色，再用藍色條件前進。",
    tags: ["Paint", "Condition"],
    map: {
      start: { x: 0, y: 0, dir: 1 },
      stars: [{ x: 1, y: 0 }],
      tiles: [
        { x: 0, y: 0, color: "R" },
        { x: 1, y: 0, color: "R" },
      ],
    },
    config: {
      f0: 5,
      f1: 0,
      f2: 0,
      tools: { paint_red: true, paint_green: true, paint_blue: true },
    },
    program: {
      commands_f0: ["paint_blue", "move:B"],
      commands_f1: [],
      commands_f2: [],
    },
    notes: [
      "筆刷會立即把當前格子塗色。",
      "條件判斷會依據塗色後的新顏色。",
      "先噴色再搭配條件，可以控制哪裡會繼續前進。",
    ],
  },
  {
    id: "blocks-functions",
    title: "函式組合",
    subtitle: "Function calls f0 / f1",
    description: "把轉彎片段寫在 f1，主程式 f0 呼叫後再微調方向。",
    tags: ["Function", "Loop via calls"],
    map: {
      start: { x: 0, y: 0, dir: 1 },
      stars: [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      tiles: [
        { x: 0, y: 0, color: "R" },
        { x: 1, y: 0, color: "G" },
        { x: 1, y: 1, color: "B" },
        { x: 0, y: 1, color: "R" },
      ],
    },
    config: {
      f0: 8,
      f1: 5,
      f2: 4,
      tools: { paint_red: true, paint_green: true, paint_blue: true },
    },
    program: {
      commands_f0: ["f1", "turn_left", "move"],
      commands_f1: ["turn_right", "move", "turn_left", "move"],
      commands_f2: [],
    },
    notes: [
      "將右轉→前進→左轉→前進封裝在 f1，當成可重用片段。",
      "f0 先呼叫 f1 拿左下角星星，再左轉往上前進收右上星星。",
      "函式能降低重複，讓主程式更精簡好讀。",
    ],
  },
];

function programToSlots(config: TutorialLevelDefinition["config"], program: ShowcaseDemo["program"]): SlotSet {
  const toSlots = (size: number, commands: string[]): CommandSlot[] => {
    const parsed = parseCommands(commands);
    const slots: CommandSlot[] = Array.from({ length: size }, () => ({ type: null, condition: null }));
    parsed.slice(0, size).forEach((command, index) => {
      slots[index] = { type: command.type, condition: command.condition ?? null };
    });
    return slots;
  };

  return {
    f0: toSlots(config.f0, program.commands_f0),
    f1: toSlots(config.f1, program.commands_f1),
    f2: toSlots(config.f2, program.commands_f2),
  };
}

function CommandRow({
  track,
  commands,
}: {
  track: "f0" | "f1" | "f2";
  commands: string[];
}) {
  if (!commands.length) return null;

  return (
    <div className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>{track}</span>
        <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500">
          {commands.length} steps
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {commands.map((command, index) => {
          const { type, condition } = parseCommandString(command);
          const conditionText = condition ? `（僅在${COLOR_LABELS[condition]}）` : "";
          return (
            <div
              key={`${track}-${index}-${command}`}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <span>
                {COMMAND_LABELS[type]}
                {conditionText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShowcaseCard({ demo }: { demo: ShowcaseDemo }) {
  const [seed, setSeed] = useState(0);
  const game = useGameState({
    mapData: demo.map,
    config: demo.config,
    initialCommands: demo.program,
    initialCommandsKey: `${demo.id}-${seed}`,
  });

  const currentState = game.currentState;
  const queueSnapshot =
    game.queueSnapshots[
      Math.min(game.timelineIndex, Math.max(0, game.queueSnapshots.length - 1))
    ] ?? [];
  const slots = useMemo(() => programToSlots(demo.config, demo.program), [demo.config, demo.program]);

  const handleRun = () => {
    game.reset();
    setTimeout(() => game.run(), 50);
  };

  const handleReplay = () => {
    setSeed((prev) => prev + 1);
    setTimeout(() => game.run(), 120);
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200/80 bg-white/92 p-5 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {demo.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                {tag}
              </span>
            ))}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
              {demo.subtitle}
            </span>
          </div>
          <div className="text-xl font-semibold text-slate-900">{demo.title}</div>
          <p className="text-sm text-slate-600">{demo.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleRun}>
            播放示範
          </Button>
          <Button size="sm" variant="secondary" onClick={handleReplay}>
            重播
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex min-h-[320px] flex-1 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="relative flex min-h-0 flex-1 items-stretch">
            <GameCanvas mapData={demo.map} state={currentState} fitToContainer />
            <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-1 ring-slate-900/10" />
          </div>
        </div>
        <ExecutionThreadBar
          queue={queueSnapshot}
          actions={<span className="text-xs font-semibold text-slate-500">示範播放中</span>}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">範例程式（積木）</div>
          <div className="pointer-events-none select-none">
            <GameDndProvider
              onDropCommand={() => {}}
              onDropCondition={() => {}}
              disabled={true}
            >
              <ProgrammingWorkspace
                config={demo.config}
                slots={slots}
                selectedSlot={null}
                onSelectSlot={() => {}}
                onClearTrack={() => {}}
              />
            </GameDndProvider>
          </div>
          <p className="text-xs text-slate-500">介面與遊戲一致，但此區僅供觀看，無法編輯。</p>
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">重點說明</div>
          <div className="space-y-2">
            {demo.notes.map((note, index) => (
              <div
                key={note}
                className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface InteractivePaneProps {
  level: TutorialLevelDefinition;
  levelNumber: number;
  totalLevels: number;
  onComplete: (levelId: string) => void;
  onNextLevel?: () => void;
}

function InteractivePane({ level, levelNumber, totalLevels, onComplete, onNextLevel }: InteractivePaneProps) {
  const [seed, setSeed] = useState(0);
  const [tourOpen, setTourOpen] = useState(true);

  const game = useGameState({
    mapData: level.map,
    config: level.config,
    initialCommands: level.initialCommands ?? null,
    initialCommandsKey: `${level.id}-${seed}`,
  });

  const currentState = game.currentState;
  const queueSnapshot =
    game.queueSnapshots[
      Math.min(game.timelineIndex, Math.max(0, game.queueSnapshots.length - 1))
    ] ?? [];

  useEffect(() => {
    setTourOpen(true);
    setSeed((prev) => prev + 1);
    game.clearAll();
    game.reset();
  }, [level.id, game.clearAll, game.reset]);

  useEffect(() => {
    const slots: Array<{ track: "f0" | "f1" | "f2"; size: number }> = [
      { track: "f0", size: level.config.f0 },
      { track: "f1", size: level.config.f1 },
      { track: "f2", size: level.config.f2 },
    ];
    const target = slots.find((item) => item.size > 0);
    if (!target) return;
    game.selectSlot(target.track, Math.max(0, target.size - 1));
  }, [level.config.f0, level.config.f1, level.config.f2, game.selectSlot, seed]);

  useEffect(() => {
    if (!game.didSucceed) return;
    onComplete(level.id);
  }, [game.didSucceed, level.id, onComplete]);

  const handleReset = () => {
    setSeed((prev) => prev + 1);
    game.clearAll();
    game.reset();
    setTourOpen(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.55fr_0.9fr]">
      <div className="relative flex min-h-[600px] flex-col gap-3 rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {`關卡 ${levelNumber} / ${totalLevels}`}
            </div>
            <div className="text-lg font-semibold text-slate-900">{level.title}</div>
            <div className="text-sm text-slate-600">{level.goal}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">星星</div>
            <div className="text-xl font-semibold text-slate-900">{currentState?.collectedStars.size ?? 0}/{level.map.stars.length}</div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-[3] flex-col gap-3">
            <div className="flex min-h-0 flex-1 rounded-[28px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur">
              <div className="relative flex min-h-0 flex-1 items-stretch">
                {game.didSucceed && (
                  <GameResultOverlay
                    title="通關完成"
                    description="這一關可以重播重練，或直接跳到下一關。"
                    tone="success"
                    primaryAction={onNextLevel ? (
                      <Button onClick={onNextLevel}>下一關</Button>
                    ) : (
                      <Button onClick={handleReset}>再跑一次</Button>
                    )}
                    secondaryAction={
                      <Button variant="outline" onClick={handleReset}>
                        重置本關
                      </Button>
                    }
                  />
                )}
                <GameCanvas mapData={level.map} state={currentState} fitToContainer />
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
              <div className="w-[clamp(200px,22vw,240px)] shrink-0">
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

      <aside className="space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">關卡說明</div>
          <div className="mt-1 text-base font-semibold text-slate-900">{level.summary}</div>
          <p className="mt-2 text-sm text-slate-600">{level.goal}</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {level.hints.map((hint) => (
              <div key={hint} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="mt-0.5 text-slate-400">•</span>
                <span className="leading-relaxed">{hint}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleReset}>
              重置程式碼
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTourOpen(true)}>
              展開導覽
            </Button>
          </div>
        </div>
      </aside>

      {level.tour ? (
        <TutorialTour steps={level.tour} open={tourOpen} onClose={() => setTourOpen(false)} />
      ) : null}
    </div>
  );
}

export default function TutorialPage() {
  const [selectedTab, setSelectedTab] = useState<TabKey>("level-0");
  const { setLevelInfo } = useNavbar();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const activeLevel = useMemo(() => {
    const tab = TABS.find((item) => item.key === selectedTab);
    if (tab?.type === "interactive" && tab.levelIndex != null) {
      return INTERACTIVE_LEVELS[tab.levelIndex] ?? INTERACTIVE_LEVELS[0];
    }
    return null;
  }, [selectedTab]);

  const levelIndex = useMemo(() => {
    if (!activeLevel) return -1;
    return INTERACTIVE_LEVELS.findIndex((item) => item?.id === activeLevel.id);
  }, [activeLevel]);

  useEffect(() => {
    if (selectedTab === "showcase" && DEMO_LEVEL) {
      setLevelInfo({ label: "Tutorial", title: DEMO_LEVEL.title });
      return () => setLevelInfo(null);
    }
    if (activeLevel) {
      setLevelInfo({ label: "Tutorial", title: activeLevel.title });
      return () => setLevelInfo(null);
    }
    return () => setLevelInfo(null);
  }, [activeLevel, selectedTab, setLevelInfo]);

  const handleComplete = (levelId: string) => {
    setCompleted((prev) => new Set(prev).add(levelId));
  };

  const handleNextLevel = () => {
    if (selectedTab === "level-0") {
      setSelectedTab("level-1");
    } else if (selectedTab === "level-1") {
      setSelectedTab("showcase");
    }
  };

  const renderContent = () => {
    if (selectedTab === "showcase" && DEMO_LEVEL) {
      return (
        <div className="mx-auto mt-6 max-w-[1400px] space-y-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Showcase
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">認識積木：範例與動畫</h2>
            <p className="text-sm text-slate-600">
              針對移動、條件、筆刷、函式分別提供範例程式與動畫，介面與遊戲一致但不能編輯，方便熟悉積木行為。
            </p>
          </div>
          <div className="space-y-4">
            {SHOWCASE_DEMOS.map((demo) => (
              <ShowcaseCard key={demo.id} demo={demo} />
            ))}
          </div>
        </div>
      );
    }

    if (activeLevel) {
      return (
        <div className="mt-6">
          <InteractivePane
            level={activeLevel}
            levelNumber={levelIndex + 1}
            totalLevels={INTERACTIVE_LEVELS.length}
            onComplete={handleComplete}
            onNextLevel={handleNextLevel}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-6" data-tour-id="tutorial-page">
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Guided Tour</div>
          <h1 className="text-3xl font-semibold text-slate-900">導覽關卡</h1>
          <p className="text-sm text-slate-600">
            三個導覽區段，點擊上方分頁即可切換。第一、二關可操作，第三關提供演示動畫與範例程式。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = selectedTab === tab.key;
            const labelSuffix =
              tab.type === "interactive" && tab.levelIndex != null
                ? INTERACTIVE_LEVELS[tab.levelIndex]?.title
                : "認識積木";
            const completedBadge =
              tab.type === "interactive" && tab.levelIndex != null && INTERACTIVE_LEVELS[tab.levelIndex]
                ? completed.has(INTERACTIVE_LEVELS[tab.levelIndex].id)
                : false;
            return (
              <button
                key={tab.key}
                type="button"
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
                onClick={() => setSelectedTab(tab.key)}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {tab.key === "showcase" ? "3" : (tab.levelIndex ?? 0) + 1}
                </span>
                <span className="truncate">{labelSuffix}</span>
                {completedBadge && <Badge className="bg-emerald-100 text-emerald-700">完成</Badge>}
              </button>
            );
          })}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
