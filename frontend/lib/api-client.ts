/**
 * Block42 Frontend - API 客戶端層
 * 封裝 fetch API，提供統一的請求接口
 */

import { getAuthToken } from "./auth-token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface ApiOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  body?: unknown;
  requiresAuth?: boolean;
  tokenOverride?: string;
}

/** 伺服器有回應但狀態碼不是 2xx */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

interface ValidationIssue {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
  ctx?: Record<string, unknown>;
}

interface ApiErrorResponse {
  detail?: string | ValidationIssue[];
  message?: string;
}

const FIELD_NAMES: Record<string, string> = {
  username: "帳號",
  password: "密碼",
  title: "關卡名稱",
  reason: "理由",
};

/** 把 FastAPI 的 422 驗證錯誤轉成一句中文 */
function describeValidationIssue(issue: ValidationIssue): string {
  const field = String(issue.loc?.[issue.loc.length - 1] ?? "");
  const name = FIELD_NAMES[field] ?? "輸入內容";
  switch (issue.type) {
    case "string_too_short":
      return `${name}至少要 ${issue.ctx?.min_length} 個字`;
    case "string_too_long":
      return `${name}最多 ${issue.ctx?.max_length} 個字`;
    case "string_pattern_mismatch":
      return field === "username" ? "帳號只能使用中英文、數字、底線或連字號" : `${name}格式不正確`;
    case "missing":
      return `請填寫${name}`;
    default:
      return issue.msg?.replace(/^Value error, /, "") ?? `${name}格式不正確`;
  }
}

function errorMessageFrom(data: ApiErrorResponse | null, fallback: string) {
  if (!data) return fallback;
  if (Array.isArray(data.detail)) {
    return data.detail.length > 0 ? describeValidationIssue(data.detail[0]) : fallback;
  }
  return data.detail || data.message || fallback;
}

/**
 * 統一的 API 請求函數
 * @template T - 預期的回應資料類型
 * @param options - 請求選項
 * @returns Promise<T>
 * @throws Error - 當請求失敗時拋出錯誤
 */
export async function apiClient<T>(options: ApiOptions): Promise<T> {
  const { method, endpoint, body, requiresAuth = false, tokenOverride } = options;

  // 1. 構建 headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 2. 如果需要認證，從 session token store 讀取
  const resolvedToken =
    tokenOverride ||
    (requiresAuth && typeof window !== "undefined" ? getAuthToken() : null);
  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  // 3. 構建完整 URL
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    // 4. 發送 fetch 請求
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // 5. 處理錯誤回應
    if (!response.ok) {
      // 嘗試解析錯誤訊息
      let errorMessage =
        response.status === 429 ? "嘗試次數太多，請稍後再試" : `伺服器回應錯誤（${response.status}）`;
      let errorData: ApiErrorResponse | null = null;
      try {
        errorData = await response.json() as ApiErrorResponse;
        errorMessage = errorMessageFrom(errorData, errorMessage);
      } catch {
        // JSON 解析失敗，使用預設錯誤訊息
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[api]", method, url, "->", response.status, errorData);
      }
      throw new ApiError(errorMessage, response.status);
    }

    // 6. 解析並返回回應資料（支援 204 No Content）
    if (response.status === 204 || response.status === 205) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (!rawText) {
      return undefined as T;
    }

    if (contentType.includes("application/json")) {
      return JSON.parse(rawText) as T;
    }

    return rawText as T;
  } catch (error) {
    // 7. 統一錯誤處理
    if (error instanceof TypeError) {
      throw new Error("連不上伺服器，請檢查網路後再試一次");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("未知錯誤");
  }
}

/**
 * GET 請求快捷方法
 */
export async function get<T>(
  endpoint: string,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>({
    method: "GET",
    endpoint,
    requiresAuth,
  });
}

/**
 * POST 請求快捷方法
 */
export async function post<T>(
  endpoint: string,
  body?: unknown,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>({
    method: "POST",
    endpoint,
    body,
    requiresAuth,
  });
}

/**
 * PUT 請求快捷方法
 */
export async function put<T>(
  endpoint: string,
  body?: unknown,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>({
    method: "PUT",
    endpoint,
    body,
    requiresAuth,
  });
}

/**
 * DELETE 請求快捷方法
 */
export async function del<T>(
  endpoint: string,
  requiresAuth = false
): Promise<T> {
  return apiClient<T>({
    method: "DELETE",
    endpoint,
    requiresAuth,
  });
}
