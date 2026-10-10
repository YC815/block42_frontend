/**
 * 登入後的導回網址只接受站內路徑，避免 javascript: 或外部網址被拿來攻擊
 */
export function safeReturnPath(raw: string | null | undefined, fallback = "/levels"): string {
  if (!raw || typeof window === "undefined") return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (url.pathname.startsWith("/login") || url.pathname.startsWith("/register")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
