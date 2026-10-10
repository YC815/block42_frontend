/**
 * Block42 Frontend - 設計師 API
 * 處理關卡 CRUD 與發布操作
 */

import { get, post, put, del } from "@/lib/api-client";
import type {
  LevelDetail,
  LevelListItem,
  LevelCreate,
  LevelUpdate,
  LevelPublish,
} from "@/types/api";

/**
 * 取得我的所有關卡（含所有狀態）
 */
export async function getMyLevels(): Promise<LevelListItem[]> {
  return get<LevelListItem[]>("/api/v1/designer/levels", true);
}

/**
 * 建立新關卡
 */
export async function createLevel(data: LevelCreate): Promise<LevelDetail> {
  return post<LevelDetail>("/api/v1/designer/levels", data, true);
}

/**
 * 更新關卡（強制回到 draft 狀態）
 */
export async function updateLevel(
  levelId: string,
  data: LevelUpdate
): Promise<LevelDetail> {
  return put<LevelDetail>(`/api/v1/designer/levels/${levelId}`, data, true);
}

/**
 * 發布關卡（提交 solution）
 */
export async function publishLevel(
  levelId: string,
  data: LevelPublish
): Promise<LevelDetail> {
  return post<LevelDetail>(
    `/api/v1/designer/levels/${levelId}/publish`,
    data,
    true
  );
}

/**
 * 刪除關卡
 */
export async function deleteLevel(levelId: string): Promise<void> {
  return del<void>(`/api/v1/designer/levels/${levelId}`, true);
}
