"""Race performance analysis: percentiles, weakness detection, comparisons."""

from dataclasses import dataclass

import numpy as np
from sqlalchemy import and_
from sqlalchemy.orm import Session

from src.database import AthleteResult
from src.scraper.hyrox import STATION_DB_FIELDS, STATION_NAMES, seconds_to_time_str

STATION_KEYS = [
    "skierg",
    "sled_push",
    "sled_pull",
    "burpee_broad_jump",
    "row",
    "farmers_carry",
    "sandbag_lunges",
    "wall_balls",
]


@dataclass
class StationPercentile:
    station_name: str
    station_key: str
    athlete_time_seconds: float | None
    athlete_time_str: str
    percentile: float | None  # 0-100, higher = better (top X%)
    rank: int | None
    total_in_category: int
    median_seconds: float | None
    median_str: str
    top10_seconds: float | None
    top10_str: str


@dataclass
class WeaknessEntry:
    station_name: str
    station_key: str
    athlete_time_seconds: float | None
    athlete_time_str: str
    median_seconds: float | None
    median_str: str
    gap_seconds: float  # how much slower than median
    gap_str: str
    percentile: float | None


@dataclass
class AnalysisResult:
    athlete_name: str
    bib_number: str
    gender: str
    age_group: str
    nationality: str
    total_time_seconds: float | None
    total_time_str: str
    overall_rank: int | None
    age_group_rank: int | None
    station_percentiles: list[StationPercentile]
    weaknesses: list[WeaknessEntry]
    run_total_seconds: float | None
    run_total_str: str
    station_total_seconds: float | None
    station_total_str: str
    total_in_category: int


def get_category_athletes(
    db: Session,
    race_event_id: int,
    gender: str,
    age_group: str,
) -> list[AthleteResult]:
    """Get all athletes in the same category (gender + age group)."""
    return (
        db.query(AthleteResult)
        .filter(
            and_(
                AthleteResult.race_event_id == race_event_id,
                AthleteResult.gender == gender,
                AthleteResult.age_group == age_group,
            )
        )
        .all()
    )


def calculate_percentile(value: float, all_values: list[float]) -> float:
    """Calculate percentile (higher = better performance = faster).

    Returns the percentage of athletes that are SLOWER than the given value.
    E.g., percentile=85 means "faster than 85% of athletes" = top 15%.
    """
    if not all_values or value is None:
        return 0.0
    slower_count = sum(1 for v in all_values if v > value)
    return round((slower_count / len(all_values)) * 100, 1)


def analyze_athlete(
    db: Session,
    athlete: AthleteResult,
) -> AnalysisResult:
    """Full analysis: percentiles for each station, weakness detection, comparisons."""
    category_athletes = get_category_athletes(
        db,
        athlete.race_event_id,
        athlete.gender,
        athlete.age_group,
    )

    total_in_category = len(category_athletes)
    station_percentiles = []

    for i, (station_name, station_key, db_field) in enumerate(
        zip(STATION_NAMES, STATION_KEYS, STATION_DB_FIELDS)
    ):
        athlete_time = getattr(athlete, db_field)
        all_times = [
            getattr(a, db_field) for a in category_athletes if getattr(a, db_field) is not None
        ]

        percentile = None
        rank = None
        median_val = None
        top10_val = None

        if all_times:
            sorted_times = sorted(all_times)
            median_val = float(np.median(sorted_times))
            top10_idx = max(0, int(len(sorted_times) * 0.1) - 1)
            top10_val = sorted_times[top10_idx]

            if athlete_time is not None:
                percentile = calculate_percentile(athlete_time, all_times)
                rank = sum(1 for t in all_times if t < athlete_time) + 1

        station_percentiles.append(
            StationPercentile(
                station_name=station_name,
                station_key=station_key,
                athlete_time_seconds=athlete_time,
                athlete_time_str=seconds_to_time_str(athlete_time),
                percentile=percentile,
                rank=rank,
                total_in_category=len(all_times),
                median_seconds=median_val,
                median_str=seconds_to_time_str(median_val),
                top10_seconds=top10_val,
                top10_str=seconds_to_time_str(top10_val),
            )
        )

    # Weakness detection: find stations where athlete loses most time vs median
    weaknesses = []
    for sp in station_percentiles:
        if sp.athlete_time_seconds is not None and sp.median_seconds is not None:
            gap = sp.athlete_time_seconds - sp.median_seconds
            weaknesses.append(
                WeaknessEntry(
                    station_name=sp.station_name,
                    station_key=sp.station_key,
                    athlete_time_seconds=sp.athlete_time_seconds,
                    athlete_time_str=sp.athlete_time_str,
                    median_seconds=sp.median_seconds,
                    median_str=sp.median_str,
                    gap_seconds=gap,
                    gap_str=seconds_to_time_str(abs(gap)),
                    percentile=sp.percentile,
                )
            )

    # Sort by gap descending (biggest time loss first), take top 3
    weaknesses.sort(key=lambda w: w.gap_seconds, reverse=True)
    top_weaknesses = [w for w in weaknesses[:3] if w.gap_seconds > 0]

    # Running vs station breakdown
    run_fields = [
        athlete.run1_seconds,
        athlete.run2_seconds,
        athlete.run3_seconds,
        athlete.run4_seconds,
        athlete.run5_seconds,
        athlete.run6_seconds,
        athlete.run7_seconds,
        athlete.run8_seconds,
    ]
    station_fields = [getattr(athlete, f) for f in STATION_DB_FIELDS]

    run_total = sum(r for r in run_fields if r is not None) if any(run_fields) else None
    station_total = sum(s for s in station_fields if s is not None) if any(station_fields) else None

    return AnalysisResult(
        athlete_name=athlete.name,
        bib_number=athlete.bib_number or "",
        gender=athlete.gender,
        age_group=athlete.age_group,
        nationality=athlete.nationality or "",
        total_time_seconds=athlete.total_time_seconds,
        total_time_str=seconds_to_time_str(athlete.total_time_seconds),
        overall_rank=athlete.overall_rank,
        age_group_rank=athlete.age_group_rank,
        station_percentiles=station_percentiles,
        weaknesses=top_weaknesses,
        run_total_seconds=run_total,
        run_total_str=seconds_to_time_str(run_total),
        station_total_seconds=station_total,
        station_total_str=seconds_to_time_str(station_total),
        total_in_category=total_in_category,
    )
