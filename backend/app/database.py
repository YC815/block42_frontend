"""資料庫連線管理"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# 確保使用 psycopg3 驅動
database_url = settings.database_url
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

# 同步 engine
engine = create_engine(
    database_url,
    echo=False,  # 需要看 SQL 時再暫時打開，避免把參數（含密碼雜湊）寫進 log
    pool_pre_ping=True,   # 連線健康檢查
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    """所有 model 的基類"""
    pass


def get_db():
    """FastAPI 依賴注入用"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
