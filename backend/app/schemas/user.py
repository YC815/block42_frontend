"""User Pydantic Schemas"""
import unicodedata

from pydantic import BaseModel, Field, field_validator

# 中英文、數字、底線、連字號；先做 NFKC 正規化，避免全形字或相似字元冒充
USERNAME_PATTERN = r"^[\w\-]+$"
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_BYTES = 72  # bcrypt 上限


def normalize_username(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip()


def validate_password_bytes(value: str) -> str:
    if len(value.encode("utf-8")) > PASSWORD_MAX_BYTES:
        raise ValueError("密碼太長（英數最多 72 字元，中文約 24 字）")
    return value


class UsernameField(BaseModel):
    username: str = Field(..., min_length=2, max_length=32, pattern=USERNAME_PATTERN)

    @field_validator("username", mode="before")
    @classmethod
    def normalize(cls, value: str) -> str:
        return normalize_username(value) if isinstance(value, str) else value


# --- Request Schemas ---
class UserRegister(UsernameField):
    """註冊使用者 Request"""
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password_bytes(value)


class UserLogin(BaseModel):
    """登入 Request"""
    username: str = Field(..., max_length=64)
    password: str = Field(..., max_length=256)

    @field_validator("username", mode="before")
    @classmethod
    def normalize(cls, value: str) -> str:
        return normalize_username(value) if isinstance(value, str) else value


# --- Response Schemas ---
class UserOut(BaseModel):
    """使用者資訊 Response（不含密碼）"""
    id: int
    username: str
    is_superuser: bool

    model_config = {"from_attributes": True}


class AdminUserCreate(UsernameField):
    """管理員建立使用者"""
    password: str = Field(..., min_length=PASSWORD_MIN_LENGTH)
    is_superuser: bool = False

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password_bytes(value)


class AdminUserUpdate(BaseModel):
    """管理員更新使用者"""
    username: str | None = Field(default=None, min_length=2, max_length=32, pattern=USERNAME_PATTERN)
    password: str | None = Field(default=None, min_length=PASSWORD_MIN_LENGTH)
    is_superuser: bool | None = None

    @field_validator("username", mode="before")
    @classmethod
    def normalize(cls, value: str | None) -> str | None:
        return normalize_username(value) if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str | None) -> str | None:
        return validate_password_bytes(value) if value is not None else value


class Token(BaseModel):
    """JWT Token Response"""
    access_token: str
    token_type: str = "bearer"
