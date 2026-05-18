"""RaceSplit API — Race performance analysis."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.auth import router as auth_router
from src.api.routes import router as main_router
from src.api.stripe_routes import router as stripe_router
from src.config import settings
from src.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Race analysis API — station-by-station performance insights, "
    "percentile rankings, and weakness detection for fitness race events.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(stripe_router, prefix="/api")


@app.on_event("startup")
def startup():
    init_db()
