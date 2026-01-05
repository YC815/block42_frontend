/**
 * Block42 Frontend - API 客戶端層
 * 封裝 fetch API，提供統一的請求接口
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface ApiOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  body?: unknown;
  requiresAuth?: boolean;
}

/**
 * 統一的 API 請求函數
 * @template T - 預期的回應資料類型
 * @param options - 請求選項
 * @returns Promise<T>
 * @throws Error - 當請求失敗時拋出錯誤
 */
export async function apiClient<T>(options: ApiOptions): Promise<T> {
  const { method, endpoint, body, requiresAuth = false } = options;

  // 1. 構建 headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // 2. 如果需要認證，從 localStorage 讀取 token
  if (requiresAuth) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
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
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // JSON 解析失敗，使用預設錯誤訊息
      }
      throw new Error(errorMessage);
    }

    // 6. 解析並返回 JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    // 7. 統一錯誤處理
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
