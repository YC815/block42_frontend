import type { LevelConfig, MapData } from "@/types/api";

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TutorialTourStep {
  id: string;
  title: string;
  description: string;
  selector?: string;
  placement?: TourPlacement;
}

export interface TutorialLevelDefinition {
  id: string;
  title: string;
  summary: string;
  goal: string;
  map: MapData;
  config: LevelConfig;
  tour: TutorialTourStep[];
  hints: string[];
  initialCommands?: {
    commands_f0: string[];
    commands_f1: string[];
    commands_f2: string[];
  } | null;
  sampleProgram?: {
    commands_f0: string[];
    commands_f1: string[];
    commands_f2: string[];
    notes: string[];
  };
}

const LEVEL_MOVE_MAP: MapData = {
  start: { x: 0, y: 0, dir: 1 },
  stars: [{ x: 1, y: 0 }],
  tiles: [
    { x: 0, y: 0, color: "R" },
    { x: 1, y: 0, color: "R" },
  ],
};

const LEVEL_TURN_MAP: MapData = {
  start: { x: 0, y: 1, dir: 1 },
  stars: [{ x: 1, y: 0 }],
  tiles: [
    { x: 0, y: 1, color: "R" },
    { x: 1, y: 1, color: "R" },
    { x: 1, y: 0, color: "R" },
  ],
};

const LEVEL_FILTER_MAP: MapData = {
  start: { x: 0, y: 0, dir: 1 },
  stars: [{ x: 2, y: 0 }],
  tiles: [
    { x: 0, y: 0, color: "R" },
    { x: 1, y: 0, color: "R" },
    { x: 2, y: 0, color: "B" },
  ],
};

const LEVEL_BRUSH_MAP: MapData = {
  start: { x: 0, y: 0, dir: 1 },
  stars: [{ x: 1, y: 0 }],
  tiles: [
    { x: 0, y: 0, color: "R" },
    { x: 1, y: 0, color: "R" },
  ],
};

const LEVEL_FINAL_MAP: MapData = {
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
};

export const TUTORIAL_LEVELS: TutorialLevelDefinition[] = [
  {
    id: "tutorial-move",
    title: "練習編碼",
    summary: "兩格直線，只要鎖定格子、放入向前並啟動即可。",
    goal: "點擊 f0 第一格加入向前指令，按播放收集星星。",
    map: LEVEL_MOVE_MAP,
    config: {
      f0: 3,
      f1: 0,
      f2: 0,
      tools: {
        paint_red: false,
        paint_green: false,
        paint_blue: false,
      },
    },
    initialCommands: null,
    tour: [
      {
        id: "slot",
        title: "點擊此格，先鎖定編輯格",
        description: "點下 f0 的第一格，讓藍色框線出現，之後的指令都會填進來。",
        selector: '[data-tour-id="workspace-f0-slot-0"]',
        placement: "bottom",
      },
      {
        id: "move",
        title: "放入向前",
        description: "在左側指令區點擊向前（↑），格子會帶上箭頭。",
        selector: '[data-tour-id="command-move"]',
        placement: "right",
      },
      {
        id: "run",
        title: "啟動看看",
        description: "路徑只有一顆星星，按播放就能看到火箭前進。",
        selector: '[data-tour-id="control-run"]',
        placement: "top",
      },
    ],
    hints: [
      "鎖定格子後才可以放指令，框線會變成深色。",
      "啟動後失敗也能按重置再排程式。",
    ],
  },
  {
    id: "tutorial-turns",
    title: "熟悉編碼",
    summary: "三格折線地圖，練習左轉與右轉的組合。",
    goal: "排出前進、轉彎再前進的流程，讓火箭轉上去收星星。",
    map: LEVEL_TURN_MAP,
    config: {
      f0: 5,
      f1: 0,
      f2: 0,
      tools: {
        paint_red: false,
        paint_green: false,
        paint_blue: false,
      },
    },
    initialCommands: null,
    tour: [
      {
        id: "turns",
        title: "現在開放了向左向右轉",
        description: "把轉彎指令與前進搭配起來，火箭就能轉上去拿星星。",
        selector: '[data-tour-id="command-turn-left"]',
        placement: "right",
      },
      {
        id: "run",
        title: "自己排排看",
        description: "失敗沒關係，按重置後再調整順序。",
        selector: '[data-tour-id="control-run"]',
        placement: "top",
      },
    ],
    hints: [
      "轉彎不會改變位置，只改變朝向。",
      "前進會依照當下朝向走一步，走到空白就會撞牆。",
    ],
  },
  {
    id: "tutorial-blocks",
    title: "認識積木",
    summary: "用小方形雙星地圖，示範函式、條件、筆刷與轉向的組合。",
    goal: "直接觀看範例程式與動畫，理解每個積木的作用與搭配。",
    map: LEVEL_FINAL_MAP,
    config: {
      f0: 8,
      f1: 5,
      f2: 4,
      tools: {
        paint_red: true,
        paint_green: true,
        paint_blue: true,
      },
    },
    tour: [],
    hints: [
      "f1 可封裝轉彎+前進的小片段，再由 f0 呼叫。",
      "條件讓片段只在特定顏色上執行，避免重複片段誤跑。",
      "筆刷能改變顏色，搭配條件做分岔或標記。",
    ],
    sampleProgram: {
      commands_f0: ["f1", "turn_left", "move"],
      commands_f1: ["turn_right", "move", "turn_left", "move"],
      commands_f2: [],
      notes: [
        "把右轉→前進→左轉→前進放在 f1，形成轉彎小片段。",
        "f0 先呼叫 f1 拿下左下角的星星，再左轉往上，最後前進收掉右上的星星。",
        "觀察 Execution 佇列與動畫，理解函式與方向的串接。",
      ],
    },
  },
];
