/**
 * Block42 Frontend - 公開關卡 API
 * 處理官方關卡、社群關卡列表與單一關卡查詢
 */

import { get, put } from "@/lib/api-client";
import type {
  Level,
  LevelListItem,
  LevelProgress,
  LevelProgressUpdate,
  LevelProgram,
  LevelProgramUpdate,
} from "@/types/api";

/**
 * 取得官方關卡列表
 */
export async function getOfficialLevels(): Promise<LevelListItem[]> {
  return get<LevelListItem[]>("/api/v1/levels/official");
}

/**
 * 取得社群關卡列表
 */
export async function getCommunityLevels(): Promise<LevelListItem[]> {
  return get<LevelListItem[]>("/api/v1/levels/community");
}

/**
 * 根據 ID 取得關卡詳情（不含 solution）
 */
export async function getLevelById(levelId: string): Promise<Level> {
  return get<Level>(`/api/v1/levels/${levelId}`);
}

/**
 * 取得使用者關卡進度
 */
export async function getLevelProgress(): Promise<LevelProgress[]> {
  return get<LevelProgress[]>("/api/v1/levels/progress", true);
}

/**
 * 更新關卡進度
 */
export async function updateLevelProgress(
  levelId: string,
  payload: LevelProgressUpdate
): Promise<LevelProgress> {
  return put<LevelProgress>(`/api/v1/levels/${levelId}/progress`, payload, true);
}

/**
 * 取得關卡程式碼
 */
export async function getLevelProgram(levelId: string): Promise<LevelProgram | null> {
  try {
    return await get<LevelProgram>(`/api/v1/levels/${levelId}/program`, true);
  } catch (error) {
    if (error instanceof Error && error.message.includes("程式尚未儲存")) {
      return null;
    }
    throw error;
  }
}

/**
 * 更新關卡程式碼
 */
export async function updateLevelProgram(
  levelId: string,
  payload: LevelProgramUpdate
): Promise<LevelProgram> {
  return put<LevelProgram>(`/api/v1/levels/${levelId}/program`, payload, true);
}
