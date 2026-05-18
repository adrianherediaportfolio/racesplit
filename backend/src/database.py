from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from src.config import settings


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_paid = Column(Boolean, default=False)
    race_analyses_count = Column(Integer, default=0)
    stripe_customer_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    saved_races = relationship("UserSavedRace", back_populates="user")


class RaceEvent(Base):
    __tablename__ = "race_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    season = Column(String(50), nullable=False)
    event_id = Column(String(100), nullable=False)
    division = Column(String(100), nullable=False)
    division_label = Column(String(255), nullable=False)
    scraped_at = Column(DateTime, nullable=True)
    athlete_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("event_id", name="uq_race_event_id"),)

    athletes = relationship("AthleteResult", back_populates="race_event")


class AthleteResult(Base):
    __tablename__ = "athlete_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    race_event_id = Column(Integer, ForeignKey("race_events.id"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    bib_number = Column(String(50), nullable=True)
    gender = Column(String(10), nullable=False)
    age_group = Column(String(20), nullable=False)
    nationality = Column(String(10), nullable=True)
    overall_rank = Column(Integer, nullable=True)
    age_group_rank = Column(Integer, nullable=True)
    total_time_seconds = Column(Float, nullable=True)
    detail_url = Column(Text, nullable=True)

    # 8 station times (seconds)
    skierg_seconds = Column(Float, nullable=True)
    sled_push_seconds = Column(Float, nullable=True)
    sled_pull_seconds = Column(Float, nullable=True)
    burpee_broad_jump_seconds = Column(Float, nullable=True)
    row_seconds = Column(Float, nullable=True)
    farmers_carry_seconds = Column(Float, nullable=True)
    sandbag_lunges_seconds = Column(Float, nullable=True)
    wall_balls_seconds = Column(Float, nullable=True)

    # 8 running splits (seconds)
    run1_seconds = Column(Float, nullable=True)
    run2_seconds = Column(Float, nullable=True)
    run3_seconds = Column(Float, nullable=True)
    run4_seconds = Column(Float, nullable=True)
    run5_seconds = Column(Float, nullable=True)
    run6_seconds = Column(Float, nullable=True)
    run7_seconds = Column(Float, nullable=True)
    run8_seconds = Column(Float, nullable=True)

    # Aggregates
    roxzone_seconds = Column(Float, nullable=True)
    run_total_seconds = Column(Float, nullable=True)

    race_event = relationship("RaceEvent", back_populates="athletes")

    __table_args__ = (
        UniqueConstraint("race_event_id", "name", "bib_number", name="uq_athlete_race"),
    )


class UserSavedRace(Base):
    __tablename__ = "user_saved_races"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    athlete_result_id = Column(Integer, ForeignKey("athlete_results.id"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_races")
    athlete_result = relationship("AthleteResult")

    __table_args__ = (UniqueConstraint("user_id", "athlete_result_id", name="uq_user_athlete"),)


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
