"""配置管理 - 用 pydantic-settings 讀取環境變數"""
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# 舊版曾把這個字串當預設值；正式環境若還在用，任何人都能偽造 token
KNOWN_INSECURE_SECRETS = {"INSECURE_DEFAULT_SECRET_CHANGE_ME"}


class Settings(BaseSettings):
    """應用程式設定

    從 .env 檔案讀取環境變數
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    database_url: str = Field(
        ...,
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    debug: bool = False
    log_level: str = "info"
    secret_key: str = Field(
        ...,
        min_length=32,
        validation_alias=AliasChoices("SECRET_KEY", "secret_key"),
        description="JWT 簽名金鑰，必須透過環境變數提供",
    )
    cors_origins: list[str] = ["http://localhost:3000"]  # CORS 允許的來源

    @field_validator("secret_key")
    @classmethod
    def reject_known_secrets(cls, value: str) -> str:
        if value in KNOWN_INSECURE_SECRETS:
            raise ValueError("SECRET_KEY 不能使用舊版的預設值，請產生新的隨機金鑰")
        return value

    @field_validator("cors_origins")
    @classmethod
    def reject_wildcard_origin(cls, value: list[str]) -> list[str]:
        if "*" in value:
            raise ValueError("CORS_ORIGINS 不能使用 *，請列出前端網址")
        return value


settings = Settings()
