from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Weekly Report API"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()
