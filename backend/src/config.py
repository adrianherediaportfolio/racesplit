from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "RaceSplit API"
    version: str = "1.0.0"
    debug: bool = False

    database_url: str = "postgresql://racesplit:racesplit@localhost:5432/racesplit"

    secret_key: str = "change-me-in-production-use-a-random-32-byte-hex"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""

    free_tier_max_analyses: int = 1

    scraper_base_url: str = "https://results.hyrox.com"
    scraper_season: str = "season-8"
    scraper_rate_limit: float = 0.5  # seconds between requests
    scraper_user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
