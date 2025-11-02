from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Service API Keys
    USER_SERVICE_API_KEY: Optional[str] = None
    JOB_SERVICE_API_KEY: Optional[str] = None
    PAYMENT_SERVICE_API_KEY: Optional[str] = None
    WS_SERVICE_API_KEY: Optional[str] = "dev-ws-service-key-change-in-production"
    
    # Service URLs
    USER_SERVICE_URL: Optional[str] = None
    JOB_SERVICE_URL: Optional[str] = None
    PAYMENT_SERVICE_URL: Optional[str] = None
    WS_SERVICE_URL: Optional[str] = None
    
    # CORS
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


def get_settings() -> Settings:
    return Settings()
