/**
 * Block42 Frontend - API 類型定義
 * 與後端 Pydantic models 完全對應的 TypeScript 接口
 *
 * 重要：此檔案已完全重寫以匹配後端架構
 */

// ==================== User 相關類型 ====================

export interface User {
  id: number;
  username: string;
  is_superuser: boolean;
}

export interface UserRegister {
  username: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// ==================== Level 相關類型 ====================

/**
 * Level 狀態（後端使用小寫）
 */
export type LevelStatus = 'draft' | 'pending' | 'published' | 'rejected';

/**
 * 公開 Level 資料（對應 LevelOut）
 */
export interface Level {
  id: string; // NanoID (12 chars)
  title: string;
  author_id: number;
  status: LevelStatus;
  is_official: boolean;
  official_order: number;
  map: MapData;
  config: LevelConfig;
  created_at: string;
  updated_at: string;
}

/**
 * 詳細 Level 資料（Designer/Admin，可含 solution）
 */
export interface LevelDetail extends Level {
  solution: Solution | null;
}

/**
 * 簡化的列表項目（用於列表顯示）
 */
export interface LevelListItem {
  id: string;
  title: string;
  author_id: number;
  status: LevelStatus;
  is_official: boolean;
  created_at: string;
}

// ==================== JSONB 資料結構 ====================

/**
 * 地圖資料結構
 *
 * 重要變更：
 * - 支援動態棋盤：不再由使用者決定 gridSize，而是依內容 + padding 自動計算
 * - 可使用負座標進行編輯，後端會在驗證時平移原點
 * - start 增加 dir 欄位
 * - stars 移除 color 欄位
 * - tiles.type 改為 tiles.color
 */
export interface MapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface MapData {
  start: {
    x: number;
    y: number;
    dir: 0 | 1 | 2 | 3; // 0:上, 1:右, 2:下, 3:左
  };
  stars: Array<{
    x: number;
    y: number;
  }>;
  tiles: Array<{
    x: number;
    y: number;
    color: 'R' | 'G' | 'B';
  }>;
  // 自動渲染資訊（可選，後端會計算並回填）
  gridSize?: number;
  padding?: number;
  bounds?: MapBounds;
}

/**
 * 關卡配置
 *
 * 重要變更：
 * - 扁平化結構（移除 slots 嵌套）
 * - available_commands 改為 tools 物件
 */
export interface LevelConfig {
  f0: number; // 0-20
  f1: number; // 0-20
  f2: number; // 0-20
  tools: {
    paint_red: boolean;
    paint_green: boolean;
    paint_blue: boolean;
  };
}

/**
 * 解答資料
 *
 * 重要變更：
 * - 分離為 commands_f0, commands_f1, commands_f2
 * - 增加 steps_count 欄位
 */
export interface Solution {
  commands_f0: string[];
  commands_f1: string[];
  commands_f2: string[];
  steps_count: number;
}

// ==================== API Request/Response 類型 ====================

/**
 * 建立關卡請求
 */
export interface LevelCreate {
  title: string;
  map: MapData;
  config: LevelConfig;
}

/**
 * 更新關卡請求
 */
export interface LevelUpdate {
  title: string;
  map: MapData;
  config: LevelConfig;
}

/**
 * 發布關卡請求
 */
export interface LevelPublish {
  solution: Solution;
  as_official?: boolean; // 管理員專用
  official_order?: number; // 管理員專用
}

/**
 * 審核通過請求
 */
export interface LevelApprove {
  as_official?: boolean;
  official_order?: number;
}

/**
 * 駁回關卡請求
 */
export interface LevelReject {
  reason: string;
}

// ==================== 遊戲引擎類型（前端特有）====================

/**
 * 方向常數（與後端 dir 對應）
 */
export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
}

/**
 * 顏色常數
 */
export type TileColor = 'R' | 'G' | 'B';

/**
 * 命令類型（前端遊戲引擎使用）
 */
export type CommandType =
  | 'move'
  | 'turn_left'
  | 'turn_right'
  | 'paint_red'
  | 'paint_green'
  | 'paint_blue'
  | 'f0'
  | 'f1'
  | 'f2';

/**
 * 座標類型（輔助類型）
 */
export interface Coordinate {
  x: number;
  y: number;
}
