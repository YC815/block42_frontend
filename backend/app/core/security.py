"""安全工具：密碼雜湊、JWT token"""
from datetime import datetime, timedelta, UTC
from typing import Any
import bcrypt
import jwt

from app.config import settings

SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12  # 12 小時

# bcrypt 只看前 72 bytes，超過會直接丟例外；schema 端已擋下更長的密碼
BCRYPT_MAX_BYTES = 72

# 帳號不存在時也跑一次 bcrypt，讓回應時間無法用來判斷帳號是否存在
_DUMMY_HASH = bcrypt.hashpw(b"block42-dummy-password", bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """驗證密碼

    Args:
        plain_password: 明文密碼
        hashed_password: Bcrypt 雜湊後的密碼（從資料庫讀取的 string）

    Returns:
        bool: 密碼是否正確
    """
    password = plain_password.encode("utf-8")
    if len(password) > BCRYPT_MAX_BYTES:
        return False
    # Bcrypt hash 是 ASCII-compatible binary data，必須用 latin-1 編碼
    return bcrypt.checkpw(password, hashed_password.encode("latin-1"))


def verify_dummy_password(plain_password: str) -> None:
    """帳號不存在時呼叫，消耗和正常驗證相同的時間"""
    verify_password(plain_password, _DUMMY_HASH)


def get_password_hash(password: str) -> str:
    """雜湊密碼

    Args:
        password: 明文密碼（UTF-8 不超過 72 bytes）

    Returns:
        str: Bcrypt 雜湊後的密碼
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(user_id: int) -> str:
    """建立 JWT token（只放使用者 ID，權限一律以資料庫為準）"""
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """解析 token，回傳使用者 ID；無效或過期回傳 None"""
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]}
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, TypeError, ValueError):
        return None
