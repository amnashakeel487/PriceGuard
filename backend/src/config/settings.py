import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    ENVIRONMENT: str = "dev"
    LOG_LEVEL: str = "INFO"
    
    # CORS Origins (support both comma separated strings and JSON list formats)
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Database Settings
    DATABASE_URL: str = "sqlite:///./priceguard.db"

    # Security Settings
    JWT_SECRET_KEY: str = "supersecretjwtkeyforpriceguarddevelopment123456789"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@priceguard.com"
    SMTP_FROM_NAME: str = "PriceGuard Alerts"

    # Scraping Settings
    SCRAPING_INTERVAL_HOURS: int = 6
    PROXY_URL: str = ""

    model_config = SettingsConfigDict(
        # Read from .env file inside backend directory or parent directories
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
