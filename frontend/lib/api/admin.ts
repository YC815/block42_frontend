/**
 * Block42 Frontend - 管理員 API
 * 處理審核隊列、通過與駁回操作
 */

import { get, post, put, del } from "@/lib/api-client";
import type {
  LevelDetail,
  LevelListItem,
  LevelApprove,
  LevelReject,
  AdminLevelListItem,
  AdminLevelUpdate,
  AdminUserCreate,
  AdminUserUpdate,
  AdminLevelTransferRequest,
  AdminLevelTransferResult,
  User,
} from "@/types/api";

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

/**
 * 取得所有關卡（管理用）
 */
export async function getAllLevels(): Promise<AdminLevelListItem[]> {
  return get<AdminLevelListItem[]>("/api/v1/admin/levels", true);
}

/**
 * 取得單一關卡詳情（管理用）
 */
export async function getAdminLevelById(levelId: string): Promise<LevelDetail> {
  return get<LevelDetail>(`/api/v1/admin/levels/${levelId}`, true);
}

/**
 * 管理員更新關卡（可部分更新）
 */
export async function updateAdminLevel(
  levelId: string,
  data: AdminLevelUpdate
): Promise<LevelDetail> {
  return put<LevelDetail>(`/api/v1/admin/levels/${levelId}`, data, true);
}

/**
 * 管理員刪除關卡
 */
export async function deleteAdminLevel(levelId: string): Promise<void> {
  return del<void>(`/api/v1/admin/levels/${levelId}`, true);
}

/**
 * 取得所有使用者（管理用）
 */
export async function getAllUsers(): Promise<User[]> {
  return get<User[]>("/api/v1/admin/users", true);
}

/**
 * 建立使用者（管理用）
 */
export async function createAdminUser(data: AdminUserCreate): Promise<User> {
  return post<User>("/api/v1/admin/users", data, true);
}

/**
 * 更新使用者（管理用）
 */
export async function updateAdminUser(userId: number, data: AdminUserUpdate): Promise<User> {
  return put<User>(`/api/v1/admin/users/${userId}`, data, true);
}

/**
 * 刪除使用者（管理用）
 */
export async function deleteAdminUser(userId: number): Promise<void> {
  return del<void>(`/api/v1/admin/users/${userId}`, true);
}

/**
 * 轉移使用者關卡（管理用）
 */
export async function transferAdminLevels(
  userId: number,
  data: AdminLevelTransferRequest
): Promise<AdminLevelTransferResult> {
  return post<AdminLevelTransferResult>(`/api/v1/admin/users/${userId}/transfer-levels`, data, true);
}
