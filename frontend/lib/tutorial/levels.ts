/* eslint-disable @typescript-eslint/no-unused-vars */

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
    title: "放進第一個指令",
    summary: "機器人前面就是星星。",
    goal: "在 F0 放一個「前進」，按執行。",
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
        title: "先選一個格子",
        description: "這是 F0 的第一格。被選取的格子會有深色外框，等一下點的指令會放進這裡。",
        selector: '[data-tour-id="workspace-f0-slot-0"]',
        placement: "bottom",
      },
      {
        id: "move",
        title: "點「前進」",
        description: "指令會放進剛剛選的格子，然後自動跳到下一格。也可以直接把指令拖進格子。",
        selector: '[data-tour-id="command-move"]',
        placement: "right",
      },
      {
        id: "run",
        title: "按執行",
        description: "機器人會從 F0 第一格開始，一格一格照著做。",
        selector: '[data-tour-id="control-run"]',
        placement: "top",
      },
    ],
    hints: [
      "再點一次已選取的格子，或按 Delete，可以清除它。",
      "失敗了就改程式再按一次執行，沒有次數限制。",
    ],
  },
  {
    id: "tutorial-turns",
    title: "轉彎",
    summary: "星星在轉角後面。",
    goal: "排出「前進、轉彎、前進」，讓機器人轉過去拿星星。",
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
        title: "左轉和右轉",
        description: "轉彎只改變機器人面向的方向，不會移動。左右是以機器人自己的方向來看。",
        selector: '[data-tour-id="command-turn_left"]',
        placement: "right",
      },
      {
        id: "run",
        title: "自己排排看",
        description: "機器人現在面向右邊。想一想：走一格之後，要往哪邊轉？",
        selector: '[data-tour-id="control-run"]',
        placement: "top",
      },
    ],
    hints: [
      "機器人的尖端是它面向的方向。",
      "走到沒有地板的地方就會失敗。",
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
