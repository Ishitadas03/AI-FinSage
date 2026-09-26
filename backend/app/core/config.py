from typing import List, Union
from urllib.parse import quote_plus, unquote_plus
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "FinSage API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/finsage_db"

    # JWT & Authentication Security
    JWT_SECRET_KEY: str = "finsage_super_secret_jwt_key_change_in_production_9f83b27e"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Clerk Authentication
    CLERK_ISSUER_URL: Union[str, None] = None
    CLERK_SECRET_KEY: Union[str, None] = None
    CLERK_WEBHOOK_SECRET: Union[str, None] = None

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "https://ai-finsage.vercel.app",
        "https://frontend-omega-lake-79.vercel.app",
    ]


    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("JWT_SECRET_KEY must be a valid non-empty string.")

        env = info.data.get("ENVIRONMENT", "development")
        debug = info.data.get("DEBUG", True)
        is_prod = str(env).lower() == "production" or not debug

        if is_prod:
            insecure_patterns = ["change_in_production", "secret", "default", "12345"]
            if any(pat in v.lower() for pat in insecure_patterns) or len(v) < 32:
                raise ValueError(
                    "Production configuration rejected: JWT_SECRET_KEY must not use default/insecure values and must be at least 32 characters long."
                )
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            return v

        url_str = v.strip().lstrip(">$# ").strip()

        # Iteratively clean prefixes and surrounding quotes
        for _ in range(5):
            url_str = url_str.lstrip(">$# ").strip()
            for prefix in [
                "export DATABASE_URL=",
                "export database_url=",
                "DATABASE_URL=",
                "database_url=",
                "psql ",
                "psql:",
            ]:
                if url_str.lower().startswith(prefix.lower()):
                    url_str = url_str[len(prefix):].strip()

            if (url_str.startswith("'") and url_str.endswith("'")) or (url_str.startswith('"') and url_str.endswith('"')):
                url_str = url_str[1:-1].strip()

        # Normalize scheme
        if url_str.startswith("postgres://"):
            url_str = "postgresql+psycopg://" + url_str[11:]
        elif url_str.startswith("postgresql://") and not url_str.startswith("postgresql+psycopg://"):
            url_str = "postgresql+psycopg://" + url_str[13:]
        elif not url_str.startswith("postgresql+psycopg://") and "://" not in url_str:
            url_str = "postgresql+psycopg://" + url_str

        # Attempt to validate or repair password encoding
        try:
            make_url(url_str)
            return url_str
        except Exception:
            if "://" in url_str:
                scheme, rest = url_str.split("://", 1)
                if "@" in rest:
                    userinfo, hostinfo = rest.rsplit("@", 1)
                    if ":" in userinfo:
                        username, password = userinfo.split(":", 1)
                        enc_user = quote_plus(unquote_plus(username))
                        enc_pass = quote_plus(unquote_plus(password))
                        url_str = f"{scheme}://{enc_user}:{enc_pass}@{hostinfo}"
                    else:
                        enc_user = quote_plus(unquote_plus(userinfo))
                        url_str = f"{scheme}://{enc_user}@{hostinfo}"
            return url_str

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
