"""Pydantic schemas for request/response models."""

from pydantic import BaseModel, EmailStr


# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_paid: bool
    race_analyses_count: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Races ---
class RaceEventResponse(BaseModel):
    name: str
    event_id: str | None = None
    label: str | None = None


class DivisionResponse(BaseModel):
    event_id: str
    label: str


# --- Search ---
class AthleteSearchRequest(BaseModel):
    event_id: str
    last_name: str = ""
    first_name: str = ""
    gender: str = "M"


class AthleteSearchResult(BaseModel):
    name: str
    nationality: str
    age_group: str
    total_time: str
    total_time_seconds: float | None
    overall_rank: int | None
    age_group_rank: int | None
    detail_url: str


# --- Analysis ---
class StationPercentileResponse(BaseModel):
    station_name: str
    station_key: str
    athlete_time_seconds: float | None
    athlete_time_str: str
    percentile: float | None
    rank: int | None
    total_in_category: int
    median_seconds: float | None
    median_str: str
    top10_seconds: float | None
    top10_str: str


class WeaknessResponse(BaseModel):
    station_name: str
    station_key: str
    athlete_time_seconds: float | None
    athlete_time_str: str
    median_seconds: float | None
    median_str: str
    gap_seconds: float
    gap_str: str
    percentile: float | None


class AnalysisResponse(BaseModel):
    athlete_name: str
    bib_number: str
    gender: str
    age_group: str
    nationality: str
    total_time_seconds: float | None
    total_time_str: str
    overall_rank: int | None
    age_group_rank: int | None
    station_percentiles: list[StationPercentileResponse]
    weaknesses: list[WeaknessResponse]
    run_total_seconds: float | None
    run_total_str: str
    station_total_seconds: float | None
    station_total_str: str
    total_in_category: int


# --- Saved Races ---
class SaveRaceRequest(BaseModel):
    athlete_result_id: int
    notes: str = ""


class SavedRaceResponse(BaseModel):
    id: int
    athlete_result_id: int
    athlete_name: str
    race_name: str
    total_time: str
    notes: str | None
    created_at: str


# --- Stripe ---
class CheckoutRequest(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str


# --- Health ---
class HealthResponse(BaseModel):
    status: str
    version: str
    app: str
