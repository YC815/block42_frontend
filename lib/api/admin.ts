/**
 * Block42 Frontend - 管理員 API
 * 處理審核隊列、通過與駁回操作
 */

import { get, post } from "@/lib/api-client";
import type { LevelDetail, LevelListItem, LevelApprove, LevelReject } from "@/types/api";

/**
 * 取得待審核關卡隊列（status=PENDING）
 */
export async function getReviewQueue(): Promise<LevelListItem[]> {
  return get<LevelListItem[]>("/api/v1/admin/queue", true);
}

/**
 * 審核通過關卡
 */
export async function approveLevel(
  levelId: string,
  data: LevelApprove
): Promise<LevelDetail> {
  return post<LevelDetail>(`/api/v1/admin/levels/${levelId}/approve`, data, true);
}

/**
 * 駁回關卡
 */
export async function rejectLevel(
  levelId: string,
  data: LevelReject
): Promise<LevelDetail> {
  return post<LevelDetail>(`/api/v1/admin/levels/${levelId}/reject`, data, true);
}
