/**
 * Block42 Frontend - 遊戲引擎類型定義
 * 純函數遊戲邏輯的核心類型
 */

import type { MapData, LevelConfig, TileColor, CommandType } from "@/types/api";

/**
 * 遊戲狀態
 * 記錄火箭的位置、方向、收集的星星等狀態
 */
export interface GameState {
  // 火箭位置
  position: { x: number; y: number };

  // 火箭方向 (0:上, 1:右, 2:下, 3:左)
  direction: 0 | 1 | 2 | 3;

  // 已收集的星星集合（使用 "x,y" 格式作為 key）
  collectedStars: Set<string>;

  // 已塗色的瓷磚 Map（使用 "x,y" 格式作為 key）
  paintedTiles: Map<string, TileColor>;

  // 執行步數
  steps: number;

  // 執行狀態
  status: "idle" | "running" | "success" | "failure";

  // 錯誤訊息（當 status === "failure" 時）
  error?: string;
}

/**
 * 命令
 */
export interface Command {
  type: CommandType;
  // 條件修飾（可選，用於條件執行）
  condition?: TileColor;
}

/**
 * 命令集（f0, f1, f2）
 */
export interface CommandSet {
  f0: Command[];
  f1: Command[];
  f2: Command[];
}

/**
 * 遊戲執行結果
 * 包含每一步的狀態快照，用於動畫重播
 */
export interface ExecutionResult {
  // 每一步的狀態快照
  states: GameState[];

  // 最終狀態
  finalState: GameState;

  // 是否成功（收集所有星星）
  success: boolean;

  // 總步數
  totalSteps: number;
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  collectedStars: number;
  totalStars: number;
}

/**
 * 方向向量（用於移動計算）
 */
export const DIRECTION_VECTORS: Record<0 | 1 | 2 | 3, { dx: number; dy: number }> = {
  0: { dx: 0, dy: -1 }, // 上
  1: { dx: 1, dy: 0 },  // 右
  2: { dx: 0, dy: 1 },  // 下
  3: { dx: -1, dy: 0 }, // 左
};

/**
 * 輔助函數：將座標轉換為字串 key
 */
export function coordToKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * 輔助函數：將字串 key 轉換為座標
 */
export function keyToCoord(key: string): { x: number; y: number } {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

/**
 * 輔助函數：檢查座標是否在地板瓷磚上
 */
export function isOnTile(x: number, y: number, mapData: MapData): boolean {
  return mapData.tiles.some((tile) => tile.x === x && tile.y === y);
}

/**
 * 輔助函數：取得指定座標的瓷磚顏色
 */
export function getTileColor(
  x: number,
  y: number,
  mapData: MapData,
  paintedTiles: Map<string, TileColor>
): TileColor | null {
  const key = coordToKey(x, y);

  // 優先使用已塗色的顏色
  if (paintedTiles.has(key)) {
    return paintedTiles.get(key)!;
  }

  // 否則使用原始瓷磚顏色
  const tile = mapData.tiles.find((t) => t.x === x && t.y === y);
  return tile ? tile.color : null;
}

/**
 * 輔助函數：檢查座標是否有星星
 */
export function hasStar(x: number, y: number, mapData: MapData): boolean {
  return mapData.stars.some((star) => star.x === x && star.y === y);
}
