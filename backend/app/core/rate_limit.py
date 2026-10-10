"""簡單的記憶體內速率限制（單一實例部署適用）

用於登入、註冊這類會跑 bcrypt 的端點，防止暴力猜密碼和 CPU 耗盡。
多實例部署時每個實例各自計數，限制會放寬為實例數倍。
"""
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int):
        self.max_attempts = max_attempts
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, *keys: str) -> None:
        now = time.monotonic()
        with self._lock:
            for key in keys:
                hits = self._hits[key]
                while hits and now - hits[0] > self.window:
                    hits.popleft()
                if len(hits) >= self.max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="嘗試次數太多，請稍後再試",
                        headers={"Retry-After": str(self.window)},
                    )
            for key in keys:
                self._hits[key].append(now)
            if len(self._hits) > 10_000:
                for key in [k for k, v in self._hits.items() if not v or now - v[-1] > self.window]:
                    del self._hits[key]


def client_ip(request: Request) -> str:
    # 部署在 Railway 這類反向代理後面時，最後一個位址是代理看到的來源；
    # 前面的位址可以被客戶端偽造，不能拿來計數
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


login_limiter = RateLimiter(max_attempts=10, window_seconds=60)
register_limiter = RateLimiter(max_attempts=5, window_seconds=600)
