/**
 * Block42 Frontend - API 類型定義
 * 與後端 Pydantic models 對應的 TypeScript 接口
 */

// ==================== User 相關類型 ====================

export interface User {
  id: number;
  username: string;
  is_superuser: boolean;
  created_at: string;
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

export type LevelStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";

export interface Level {
  id: string; // NanoID (12 chars)
  title: string;
  status: LevelStatus;
  author_id: number;
  is_official: boolean;
  official_order: number | null;
  map_data: MapData;
  config: LevelConfig;
  solution: LevelSolution | null;
  metadata: LevelMetadata;
  created_at: string;
  updated_at: string;
}

// ==================== JSONB 資料結構 ====================

export interface MapData {
  width: number;
  height: number;
  start: {
    x: number;
    y: number;
  };
  stars: Array<{
    x: number;
    y: number;
    color: string;
  }>;
  tiles: Array<{
    x: number;
    y: number;
    type: string;
  }>;
}

export interface LevelConfig {
  slots: {
    f0: number;
    f1: number;
    f2: number;
  };
  available_commands: string[];
}

export interface LevelSolution {
  commands: string[];
}

export interface LevelMetadata {
  reject_reason?: string;
}

// ==================== API Request/Response 類型 ====================

export interface LevelCreate {
  title: string;
  map_data: MapData;
  config: LevelConfig;
}

export interface LevelUpdate {
  title?: string;
  map_data?: MapData;
  config?: LevelConfig;
}

export interface LevelPublish {
  solution: LevelSolution;
  as_official?: boolean;
  official_order?: number;
}

export interface LevelApprove {
  as_official?: boolean;
  official_order?: number;
}

export interface LevelReject {
  reason: string;
}

// 簡化的列表項目（用於列表顯示）
export interface LevelListItem {
  id: string;
  title: string;
  status: LevelStatus;
  author_id: number;
  is_official: boolean;
  created_at: string;
}

// ==================== API 回應統一格式 ====================

export interface ApiResponse<T = unknown> {
  status: number;
  data?: T;
  error?: string;
}

// ==================== 測試數據類型 ====================

export interface TestAccount {
  username: string;
  password: string;
}
