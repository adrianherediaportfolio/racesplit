"""Main API routes: races, search, analysis, saved races."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.api.auth import get_current_user, get_optional_user
from src.config import settings
from src.database import AthleteResult, RaceEvent, UserSavedRace, get_db
from src.models import (
    AnalysisResponse,
    AthleteSearchRequest,
    AthleteSearchResult,
    DivisionResponse,
    HealthResponse,
    RaceEventResponse,
    SavedRaceResponse,
    SaveRaceRequest,
    StationPercentileResponse,
    WeaknessResponse,
)
from src.scraper.hyrox import HyroxScraper
from src.services.analysis import analyze_athlete

logger = logging.getLogger(__name__)
router = APIRouter(tags=["races"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.version,
        app=settings.app_name,
    )


@router.get("/races", response_model=list[RaceEventResponse])
def list_races():
    """List available race events from results site."""
    scraper = HyroxScraper()
    try:
        races = scraper.get_available_races()
        return [RaceEventResponse(name=r["name"], label=r["label"]) for r in races]
    finally:
        scraper.close()


@router.get("/races/{race_name}/divisions", response_model=list[DivisionResponse])
def list_divisions(race_name: str):
    """List available divisions for a specific race."""
    scraper = HyroxScraper()
    try:
        divisions = scraper.get_divisions_for_race(race_name)
        return [DivisionResponse(**d) for d in divisions]
    finally:
        scraper.close()


@router.post("/search", response_model=list[AthleteSearchResult])
def search_athletes(data: AthleteSearchRequest):
    """Search for an athlete by name in a specific race event."""
    scraper = HyroxScraper()
    try:
        results = scraper.search_athlete(
            event_id=data.event_id,
            last_name=data.last_name,
            first_name=data.first_name,
            gender=data.gender,
        )
        return [
            AthleteSearchResult(
                name=r.name,
                nationality=r.nationality,
                age_group=r.age_group,
                total_time=r.total_time,
                total_time_seconds=r.total_time_seconds,
                overall_rank=r.overall_rank,
                age_group_rank=r.age_group_rank,
                detail_url=r.detail_url,
            )
            for r in results
        ]
    finally:
        scraper.close()


@router.post("/analyze")
def analyze(
    data: AthleteSearchRequest,
    detail_url: str = "",
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    """Full analysis for an athlete: scrape data, compute percentiles, detect weaknesses.

    Workflow:
    1. Search for the athlete if detail_url not provided
    2. Scrape their full splits from the detail page
    3. Ensure we have the category dataset (scrape if needed)
    4. Compute percentiles, weaknesses, comparisons
    """
    scraper = HyroxScraper()
    try:
        # Check free tier limit
        if (
            user
            and not user.is_paid
            and user.race_analyses_count >= settings.free_tier_max_analyses
        ):
            raise HTTPException(
                status_code=403,
                detail="Free tier limit reached. Upgrade to analyze more races.",
            )

        # Find athlete
        if not detail_url:
            results = scraper.search_athlete(
                event_id=data.event_id,
                last_name=data.last_name,
                first_name=data.first_name,
                gender=data.gender,
            )
            if not results:
                raise HTTPException(status_code=404, detail="Athlete not found")
            detail_url = results[0].detail_url

        # Scrape athlete detail
        splits = scraper.scrape_athlete_detail(detail_url)
        if not splits.name:
            raise HTTPException(status_code=404, detail="Could not parse athlete details")

        # Infer gender from the search parameter
        gender = data.gender

        # Find or create race event
        race_event = db.query(RaceEvent).filter(RaceEvent.event_id == data.event_id).first()
        if not race_event:
            race_event = RaceEvent(
                name=splits.race_name or data.event_id,
                season=settings.scraper_season,
                event_id=data.event_id,
                division=splits.division or "",
                division_label=splits.division or "",
            )
            db.add(race_event)
            db.commit()
            db.refresh(race_event)

        # Check if we need to scrape the category dataset
        category_count = (
            db.query(AthleteResult)
            .filter(
                AthleteResult.race_event_id == race_event.id,
                AthleteResult.gender == gender,
                AthleteResult.age_group == splits.age_group,
            )
            .count()
        )

        if category_count < 5:
            logger.info(
                "Scraping category dataset: %s %s for event %s",
                gender,
                splits.age_group,
                data.event_id,
            )
            _scrape_and_store_category(scraper, db, race_event, gender, splits.age_group)

        # Find or create the target athlete record
        athlete_record = (
            db.query(AthleteResult)
            .filter(
                AthleteResult.race_event_id == race_event.id,
                AthleteResult.name == splits.name,
            )
            .first()
        )

        if not athlete_record:
            athlete_record = _create_athlete_record(splits, race_event.id, gender)
            db.add(athlete_record)
            db.commit()
            db.refresh(athlete_record)
        else:
            _update_athlete_record(athlete_record, splits)
            db.commit()
            db.refresh(athlete_record)

        # Increment analysis count
        if user:
            user.race_analyses_count += 1
            db.commit()

        # Perform analysis
        analysis = analyze_athlete(db, athlete_record)

        return AnalysisResponse(
            athlete_name=analysis.athlete_name,
            bib_number=analysis.bib_number,
            gender=analysis.gender,
            age_group=analysis.age_group,
            nationality=analysis.nationality,
            total_time_seconds=analysis.total_time_seconds,
            total_time_str=analysis.total_time_str,
            overall_rank=analysis.overall_rank,
            age_group_rank=analysis.age_group_rank,
            station_percentiles=[
                StationPercentileResponse(
                    station_name=sp.station_name,
                    station_key=sp.station_key,
                    athlete_time_seconds=sp.athlete_time_seconds,
                    athlete_time_str=sp.athlete_time_str,
                    percentile=sp.percentile,
                    rank=sp.rank,
                    total_in_category=sp.total_in_category,
                    median_seconds=sp.median_seconds,
                    median_str=sp.median_str,
                    top10_seconds=sp.top10_seconds,
                    top10_str=sp.top10_str,
                )
                for sp in analysis.station_percentiles
            ],
            weaknesses=[
                WeaknessResponse(
                    station_name=w.station_name,
                    station_key=w.station_key,
                    athlete_time_seconds=w.athlete_time_seconds,
                    athlete_time_str=w.athlete_time_str,
                    median_seconds=w.median_seconds,
                    median_str=w.median_str,
                    gap_seconds=w.gap_seconds,
                    gap_str=w.gap_str,
                    percentile=w.percentile,
                )
                for w in analysis.weaknesses
            ],
            run_total_seconds=analysis.run_total_seconds,
            run_total_str=analysis.run_total_str,
            station_total_seconds=analysis.station_total_seconds,
            station_total_str=analysis.station_total_str,
            total_in_category=analysis.total_in_category,
        )
    finally:
        scraper.close()


def _scrape_and_store_category(
    scraper: HyroxScraper,
    db: Session,
    race_event: RaceEvent,
    gender: str,
    age_group: str,
):
    """Scrape all athletes in a category and store their basic data + detail splits."""
    # Map age group display format to search parameter
    age_param = "%"
    if age_group == "16-24":
        age_param = "U24"
    elif "-" in age_group:
        age_param = age_group.split("-")[0]

    all_entries = scraper.scrape_all_athletes(
        event_id=race_event.event_id,
        gender=gender,
        age_group=age_param,
        max_pages=50,
    )

    logger.info("Found %d athletes in category %s %s", len(all_entries), gender, age_group)

    # For each athlete, scrape their detail page for full splits
    for i, entry in enumerate(all_entries):
        existing = (
            db.query(AthleteResult)
            .filter(
                AthleteResult.race_event_id == race_event.id,
                AthleteResult.name == entry.name,
            )
            .first()
        )

        if existing and existing.skierg_seconds is not None:
            continue  # Already have full data

        try:
            detail = scraper.scrape_athlete_detail(entry.detail_url)
            record = existing or AthleteResult(
                race_event_id=race_event.id,
                name=entry.name,
                gender=gender,
            )

            record.bib_number = detail.bib_number or record.bib_number
            record.age_group = detail.age_group or entry.age_group
            record.nationality = detail.nationality or entry.nationality
            record.overall_rank = entry.overall_rank
            record.age_group_rank = entry.age_group_rank
            record.total_time_seconds = entry.total_time_seconds
            record.detail_url = entry.detail_url

            # Station times
            record.skierg_seconds = detail.station_times.get("skierg")
            record.sled_push_seconds = detail.station_times.get("sled_push")
            record.sled_pull_seconds = detail.station_times.get("sled_pull")
            record.burpee_broad_jump_seconds = detail.station_times.get("burpee_broad_jump")
            record.row_seconds = detail.station_times.get("row")
            record.farmers_carry_seconds = detail.station_times.get("farmers_carry")
            record.sandbag_lunges_seconds = detail.station_times.get("sandbag_lunges")
            record.wall_balls_seconds = detail.station_times.get("wall_balls")

            # Run times
            for j in range(8):
                setattr(record, f"run{j + 1}_seconds", detail.run_times.get(f"run{j + 1}"))

            record.roxzone_seconds = detail.roxzone_seconds
            record.run_total_seconds = detail.run_total_seconds

            if not existing:
                db.add(record)

            if (i + 1) % 10 == 0:
                db.commit()
                logger.info("Progress: %d/%d athletes", i + 1, len(all_entries))

        except Exception as e:
            logger.warning("Failed to scrape detail for %s: %s", entry.name, e)
            continue

    db.commit()
    race_event.scraped_at = datetime.utcnow()
    race_event.athlete_count = len(all_entries)
    db.commit()


def _create_athlete_record(splits, race_event_id: int, gender: str) -> AthleteResult:
    record = AthleteResult(
        race_event_id=race_event_id,
        name=splits.name,
        bib_number=splits.bib_number,
        gender=gender,
        age_group=splits.age_group,
        nationality=splits.nationality,
        overall_rank=splits.overall_rank,
        age_group_rank=splits.age_group_rank,
        total_time_seconds=splits.total_time_seconds,
        skierg_seconds=splits.station_times.get("skierg"),
        sled_push_seconds=splits.station_times.get("sled_push"),
        sled_pull_seconds=splits.station_times.get("sled_pull"),
        burpee_broad_jump_seconds=splits.station_times.get("burpee_broad_jump"),
        row_seconds=splits.station_times.get("row"),
        farmers_carry_seconds=splits.station_times.get("farmers_carry"),
        sandbag_lunges_seconds=splits.station_times.get("sandbag_lunges"),
        wall_balls_seconds=splits.station_times.get("wall_balls"),
        roxzone_seconds=splits.roxzone_seconds,
        run_total_seconds=splits.run_total_seconds,
    )
    for i in range(8):
        setattr(record, f"run{i + 1}_seconds", splits.run_times.get(f"run{i + 1}"))
    return record


def _update_athlete_record(record: AthleteResult, splits):
    record.bib_number = splits.bib_number or record.bib_number
    record.overall_rank = splits.overall_rank or record.overall_rank
    record.age_group_rank = splits.age_group_rank or record.age_group_rank
    record.total_time_seconds = splits.total_time_seconds or record.total_time_seconds
    record.skierg_seconds = splits.station_times.get("skierg") or record.skierg_seconds
    record.sled_push_seconds = splits.station_times.get("sled_push") or record.sled_push_seconds
    record.sled_pull_seconds = splits.station_times.get("sled_pull") or record.sled_pull_seconds
    record.burpee_broad_jump_seconds = (
        splits.station_times.get("burpee_broad_jump") or record.burpee_broad_jump_seconds
    )
    record.row_seconds = splits.station_times.get("row") or record.row_seconds
    record.farmers_carry_seconds = (
        splits.station_times.get("farmers_carry") or record.farmers_carry_seconds
    )
    record.sandbag_lunges_seconds = (
        splits.station_times.get("sandbag_lunges") or record.sandbag_lunges_seconds
    )
    record.wall_balls_seconds = splits.station_times.get("wall_balls") or record.wall_balls_seconds
    record.roxzone_seconds = splits.roxzone_seconds or record.roxzone_seconds
    record.run_total_seconds = splits.run_total_seconds or record.run_total_seconds
    for i in range(8):
        val = splits.run_times.get(f"run{i + 1}")
        if val:
            setattr(record, f"run{i + 1}_seconds", val)


# --- Saved Races ---
@router.post("/saved-races")
def save_race(
    data: SaveRaceRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    athlete = db.query(AthleteResult).filter(AthleteResult.id == data.athlete_result_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete result not found")

    existing = (
        db.query(UserSavedRace)
        .filter(
            UserSavedRace.user_id == user.id,
            UserSavedRace.athlete_result_id == data.athlete_result_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Race already saved")

    saved = UserSavedRace(
        user_id=user.id,
        athlete_result_id=data.athlete_result_id,
        notes=data.notes or None,
    )
    db.add(saved)
    db.commit()

    return {"status": "saved", "id": saved.id}


@router.get("/saved-races", response_model=list[SavedRaceResponse])
def list_saved_races(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(UserSavedRace)
        .filter(UserSavedRace.user_id == user.id)
        .order_by(UserSavedRace.created_at.desc())
        .all()
    )

    from src.scraper.hyrox import seconds_to_time_str

    results = []
    for s in saved:
        athlete = s.athlete_result
        race_event = athlete.race_event if athlete else None
        results.append(
            SavedRaceResponse(
                id=s.id,
                athlete_result_id=s.athlete_result_id,
                athlete_name=athlete.name if athlete else "Unknown",
                race_name=race_event.name if race_event else "Unknown",
                total_time=seconds_to_time_str(athlete.total_time_seconds) if athlete else "–",
                notes=s.notes,
                created_at=s.created_at.isoformat() if s.created_at else "",
            )
        )

    return results


@router.delete("/saved-races/{saved_race_id}")
def delete_saved_race(
    saved_race_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    saved = (
        db.query(UserSavedRace)
        .filter(UserSavedRace.id == saved_race_id, UserSavedRace.user_id == user.id)
        .first()
    )
    if not saved:
        raise HTTPException(status_code=404, detail="Saved race not found")

    db.delete(saved)
    db.commit()
    return {"status": "deleted"}
