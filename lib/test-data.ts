/**
 * Block42 Frontend - 測試數據
 * 提供預設的測試賬號和 JSONB 數據範例
 */

import type { TestAccount, MapData, LevelConfig, LevelSolution } from "@/types/api";

// ==================== 測試賬號 ====================

export const TEST_ACCOUNTS: {
  normalUser: TestAccount;
  superuser: TestAccount;
} = {
  normalUser: {
    username: "testuser",
    password: "testpass123",
  },
  superuser: {
    username: "admin",
    password: "adminpass123",
  },
};

// ==================== 測試關卡數據 ====================

export const TEST_LEVEL_DATA = {
  map_data: {
    width: 5,
    height: 5,
    start: { x: 0, y: 0 },
    stars: [{ x: 4, y: 4, color: "yellow" }],
    tiles: [
      { x: 0, y: 0, type: "floor" },
      { x: 1, y: 0, type: "floor" },
      { x: 2, y: 0, type: "floor" },
      { x: 3, y: 0, type: "floor" },
      { x: 4, y: 0, type: "floor" },
      { x: 0, y: 1, type: "floor" },
      { x: 1, y: 1, type: "wall" },
      { x: 2, y: 1, type: "floor" },
      { x: 3, y: 1, type: "wall" },
      { x: 4, y: 1, type: "floor" },
      { x: 0, y: 2, type: "floor" },
      { x: 1, y: 2, type: "floor" },
      { x: 2, y: 2, type: "floor" },
      { x: 3, y: 2, type: "floor" },
      { x: 4, y: 2, type: "floor" },
      { x: 0, y: 3, type: "floor" },
      { x: 1, y: 3, type: "wall" },
      { x: 2, y: 3, type: "floor" },
      { x: 3, y: 3, type: "wall" },
      { x: 4, y: 3, type: "floor" },
      { x: 0, y: 4, type: "floor" },
      { x: 1, y: 4, type: "floor" },
      { x: 2, y: 4, type: "floor" },
      { x: 3, y: 4, type: "floor" },
      { x: 4, y: 4, type: "floor" },
    ],
  } as MapData,

  config: {
    slots: {
      f0: 5,
      f1: 3,
      f2: 0,
    },
    available_commands: ["move", "turn_left", "turn_right", "jump"],
  } as LevelConfig,

  solution: {
    commands: ["move", "move", "turn_right", "move", "move"],
  } as LevelSolution,
};

// ==================== 範例關卡標題 ====================

export const EXAMPLE_TITLES = [
  "簡單迷宮",
  "跳躍挑戰",
  "星星收集",
  "複雜路徑",
  "初學者關卡",
];
