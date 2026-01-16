"""
Configuration Settings for Aadhaar Pulse Analytics Backend

Uses Pydantic Settings for environment variable management with validation.
"""

from functools import lru_cache
from typing import List, Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Server Configuration
    api_host: str = Field(default="0.0.0.0", description="API server host")
    api_port: int = Field(default=8000, description="API server port")
    debug: bool = Field(default=False, description="Debug mode")
    environment: Literal["development", "staging", "production"] = Field(
        default="development"
    )
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"]
    )
    
    # Database
    database_url: str = Field(default="sqlite:///./aadhaar_pulse.db")
    
    # Redis Cache
    redis_url: str = Field(default="redis://localhost:6379/0")
    
    # LLM Configuration
    openai_api_key: str = Field(default="")
    openai_model: str = Field(default="gpt-4-turbo-preview")
    anthropic_api_key: str = Field(default="")
    anthropic_model: str = Field(default="claude-3-opus-20240229")
    huggingface_api_key: str = Field(default="", alias="HF_TOKEN")
    huggingface_model: str = Field(default="meta-llama/Llama-3.1-8B-Instruct")
    llm_provider: Literal["openai", "anthropic", "huggingface"] = Field(default="huggingface")
    
    # Security Configuration
    secret_key: str = Field(default="change-me-in-production")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    
    # File Upload Configuration
    max_upload_size_mb: int = Field(default=100)
    allowed_extensions: List[str] = Field(
        default=["csv", "json", "xlsx", "xls"]
    )
    
    # Analysis Configuration
    correlation_threshold: float = Field(
        default=0.7, 
        description="Threshold for identifying strong correlations"
    )
    volatility_high_threshold: float = Field(
        default=0.5,
        description="CV threshold for high volatility"
    )
    volatility_low_threshold: float = Field(
        default=0.15,
        description="CV threshold for low volatility (stable)"
    )
    zscore_anomaly_threshold: float = Field(
        default=2.0,
        description="Z-score threshold for flagging anomalies"
    )
    pvalue_significance: float = Field(
        default=0.05,
        description="P-value threshold for statistical significance"
    )
    
    # Differential Privacy
    differential_privacy_epsilon: float = Field(
        default=1.0,
        description="Epsilon parameter for differential privacy"
    )
    
    # Logging
    log_level: str = Field(default="INFO")
    log_file: str = Field(default="logs/aadhaar_pulse.log")
    
    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes for file size validation."""
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance
settings = get_settings()
