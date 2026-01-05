/**
 * Block42 Frontend - 公開關卡 API
 * 處理官方關卡、社群關卡列表與單一關卡查詢
 */

import { get } from "@/lib/api-client";
import type { Level, LevelListItem } from "@/types/api";

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
