"""FastAPI 應用入口"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import engine
from app.config import settings
from app.api.v1 import auth, levels, designer, admin

MAX_BODY_BYTES = 512 * 1024  # 最大地圖 128x128 約 400KB


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用啟動/關閉時的生命週期管理"""
    try:
        with engine.connect():
            print("Database connected")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise

    yield

    engine.dispose()


app = FastAPI(
    title="Block42 Backend",
    version="0.2.0",
    debug=settings.debug,
    lifespan=lifespan,
    # 正式環境不公開 API 文件
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    """擋下過大的請求，避免塞爆 JSON 解析和資料庫"""
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length", "")
        if not content_length.isdigit():
            # 不接受沒有長度的串流上傳，否則無法事先擋下過大的內容
            return JSONResponse(status_code=411, content={"detail": "缺少 Content-Length"})
        if int(content_length) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"detail": "請求內容過大"})
    return await call_next(request)


# 前端用 Authorization header 帶 token，不需要跨站 cookie
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(levels.router, prefix="/api/v1")
app.include_router(designer.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
def health_check():
    """健康檢查端點"""
    return {"status": "ok"}
