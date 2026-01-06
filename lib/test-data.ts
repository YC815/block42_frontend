/**
 * Block42 Frontend - 測試數據
 * 提供預設的測試賬號和 JSONB 數據範例
 *
 * 已更新以匹配新的 API 類型定義
 */

import type { MapData, LevelConfig, Solution } from "@/types/api";

// ==================== 測試賬號 ====================

export interface TestAccount {
  username: string;
  password: string;
}

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

/**
 * 範例關卡：5x5 簡單迷宮
 * 起點: (0, 0) 朝右
 * 星星: (4, 4)
 * 地板瓷磚: 紅色
 */
export const TEST_LEVEL_DATA = {
  map: {
    gridSize: 5,
    start: { x: 0, y: 0, dir: 1 }, // 朝右
    stars: [{ x: 4, y: 4 }],
    tiles: [
      // 第一行
      { x: 0, y: 0, color: 'R' as const },
      { x: 1, y: 0, color: 'R' as const },
      { x: 2, y: 0, color: 'R' as const },
      { x: 3, y: 0, color: 'R' as const },
      { x: 4, y: 0, color: 'R' as const },
      // 第二行
      { x: 0, y: 1, color: 'R' as const },
      { x: 2, y: 1, color: 'R' as const },
      { x: 4, y: 1, color: 'R' as const },
      // 第三行
      { x: 0, y: 2, color: 'R' as const },
      { x: 1, y: 2, color: 'R' as const },
      { x: 2, y: 2, color: 'R' as const },
      { x: 3, y: 2, color: 'R' as const },
      { x: 4, y: 2, color: 'R' as const },
      // 第四行
      { x: 0, y: 3, color: 'R' as const },
      { x: 2, y: 3, color: 'R' as const },
      { x: 4, y: 3, color: 'R' as const },
      // 第五行
      { x: 0, y: 4, color: 'R' as const },
      { x: 1, y: 4, color: 'R' as const },
      { x: 2, y: 4, color: 'R' as const },
      { x: 3, y: 4, color: 'R' as const },
      { x: 4, y: 4, color: 'R' as const },
    ],
  } satisfies MapData,

  config: {
    f0: 10,
    f1: 0,
    f2: 0,
    tools: {
      paint_red: false,
      paint_green: false,
      paint_blue: false,
    },
  } satisfies LevelConfig,

  solution: {
    commands_f0: ["move", "move", "turn_right", "move", "move"],
    commands_f1: [],
    commands_f2: [],
    steps_count: 5,
  } satisfies Solution,
};

/**
 * 範例關卡：多顏色地板
 */
export const TEST_LEVEL_MULTICOLOR = {
  map: {
    gridSize: 4,
    start: { x: 0, y: 0, dir: 1 }, // 朝右
    stars: [{ x: 2, y: 2 }],
    tiles: [
      { x: 0, y: 0, color: 'R' as const },
      { x: 1, y: 0, color: 'G' as const },
      { x: 2, y: 0, color: 'B' as const },
      { x: 0, y: 1, color: 'B' as const },
      { x: 1, y: 1, color: 'R' as const },
      { x: 2, y: 1, color: 'G' as const },
      { x: 0, y: 2, color: 'G' as const },
      { x: 1, y: 2, color: 'B' as const },
      { x: 2, y: 2, color: 'R' as const },
    ],
  } satisfies MapData,

  config: {
    f0: 15,
    f1: 5,
    f2: 0,
    tools: {
      paint_red: true,
      paint_green: true,
      paint_blue: true,
    },
  } satisfies LevelConfig,
};

// ==================== 範例關卡標題 ====================

export const EXAMPLE_TITLES = [
  "簡單迷宮",
  "色彩挑戰",
  "星星收集",
  "複雜路徑",
  "初學者關卡",
  "進階挑戰",
  "函數練習",
  "條件判斷",
];
