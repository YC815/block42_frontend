/**
 * Block42 Frontend - 公開關卡 API
 * 社群關卡列表、單一關卡查詢、玩家進度與存檔。
 * 官方關卡不經過 API，見 lib/levels/official.ts。
 */

import { ApiError, get, post, put } from "@/lib/api-client";
import type {
  Level,
  LevelListItem,
  LevelProgress,
  LevelProgram,
  LevelProgramUpdate,
} from "@/types/api";

const levelPath = (levelId: string) => `/api/v1/levels/${encodeURIComponent(levelId)}`;

/**
 * 取得社群關卡列表
 */
export async function getCommunityLevels(): Promise<LevelListItem[]> {
  return get<LevelListItem[]>("/api/v1/levels/community");
}

/**
 * 根據 ID 取得社群關卡詳情（不含 solution）
 */
export async function getLevelById(levelId: string): Promise<Level> {
  return get<Level>(levelPath(levelId));
}

/**
 * 取得使用者關卡進度
 */
export async function getLevelProgress(): Promise<LevelProgress[]> {
  return get<LevelProgress[]>("/api/v1/levels/progress", true);
}

/**
 * 提交過關程式，伺服器重跑確認後才記錄完成
 */
export async function completeLevel(
  levelId: string,
  program: LevelProgramUpdate
): Promise<LevelProgress> {
  return post<LevelProgress>(`${levelPath(levelId)}/complete`, program, true);
}

/**
 * 取得關卡程式碼
 */
export async function getLevelProgram(levelId: string): Promise<LevelProgram | null> {
  try {
    return await get<LevelProgram>(`${levelPath(levelId)}/program`, true);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
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
  return put<LevelProgram>(`${levelPath(levelId)}/program`, payload, true);
}
