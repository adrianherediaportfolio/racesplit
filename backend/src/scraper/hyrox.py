"""Scraper for results.hyrox.com race data.

The site uses server-rendered HTML (mika:timing platform), so we parse
with BeautifulSoup. Two main page types:

1. List page — shows athletes ranked by a selected workout
   URL: /season-8/?pid=list&event={event_id}&ranking={workout}&...
2. Detail page — shows full workout summary for one athlete
   URL: /season-8/?content=detail&idp={athlete_id}&event={event_id}&...
"""

import logging
import re
import time
from dataclasses import dataclass, field
from urllib.parse import urlencode, urljoin

import httpx
from bs4 import BeautifulSoup

from src.config import settings

logger = logging.getLogger(__name__)

STATION_NAMES = [
    "1000m SkiErg",
    "50m Sled Push",
    "50m Sled Pull",
    "80m Burpee Broad Jump",
    "1000m Row",
    "200m Farmers Carry",
    "100m Sandbag Lunges",
    "Wall Balls",
]

STATION_DB_FIELDS = [
    "skierg_seconds",
    "sled_push_seconds",
    "sled_pull_seconds",
    "burpee_broad_jump_seconds",
    "row_seconds",
    "farmers_carry_seconds",
    "sandbag_lunges_seconds",
    "wall_balls_seconds",
]

RUN_DB_FIELDS = [
    "run1_seconds",
    "run2_seconds",
    "run3_seconds",
    "run4_seconds",
    "run5_seconds",
    "run6_seconds",
    "run7_seconds",
    "run8_seconds",
]


def parse_time_to_seconds(time_str: str) -> float | None:
    """Convert HH:MM:SS or MM:SS to total seconds."""
    if not time_str or time_str.strip() in ("–", "-", "—", ""):
        return None
    time_str = time_str.strip()
    parts = time_str.split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        else:
            return float(time_str)
    except (ValueError, IndexError):
        return None


def seconds_to_time_str(seconds: float | None) -> str:
    """Convert seconds to MM:SS or HH:MM:SS string."""
    if seconds is None:
        return "–"
    total = int(seconds)
    hours = total // 3600
    minutes = (total % 3600) // 60
    secs = total % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


@dataclass
class RaceInfo:
    name: str
    event_id: str
    division_label: str


@dataclass
class AthleteListEntry:
    name: str
    nationality: str
    age_group: str
    total_time: str
    total_time_seconds: float | None
    overall_rank: int | None
    age_group_rank: int | None
    detail_url: str


@dataclass
class AthleteSplits:
    name: str = ""
    bib_number: str = ""
    age_group: str = ""
    nationality: str = ""
    gender: str = ""
    race_name: str = ""
    division: str = ""
    overall_rank: int | None = None
    age_group_rank: int | None = None
    total_time_seconds: float | None = None
    station_times: dict[str, float | None] = field(default_factory=dict)
    run_times: dict[str, float | None] = field(default_factory=dict)
    roxzone_seconds: float | None = None
    run_total_seconds: float | None = None


class HyroxScraper:
    def __init__(self):
        self.base_url = f"{settings.scraper_base_url}/{settings.scraper_season}/"
        self.client = httpx.Client(
            headers={"User-Agent": settings.scraper_user_agent},
            follow_redirects=True,
            timeout=30.0,
        )
        self.last_request_time = 0.0

    def _rate_limit(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < settings.scraper_rate_limit:
            time.sleep(settings.scraper_rate_limit - elapsed)
        self.last_request_time = time.time()

    def _get(self, url: str) -> BeautifulSoup:
        self._rate_limit()
        resp = self.client.get(url)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")

    def get_available_races(self) -> list[dict]:
        """Fetch available races and their divisions from the search form."""
        soup = self._get(self.base_url)
        races = []

        race_select = soup.find("select", {"name": "event_main_group"})
        if not race_select:
            return races

        for option in race_select.find_all("option"):
            value = option.get("value", "").strip()
            if value:
                races.append({"name": value, "label": option.text.strip()})

        return races

    def get_divisions_for_race(self, race_name: str) -> list[dict]:
        """Fetch available divisions after selecting a race.

        The site uses JavaScript to update divisions when race changes,
        so we submit the form to get the page with correct divisions.
        """
        params = {
            "pid": "start",
            "pidp": "ranking_nav",
        }
        soup = self._get(f"{self.base_url}?{urlencode(params)}")

        form = soup.find("form", {"name": "form_lists_default"})
        if not form:
            return []

        # Select the race first, then get divisions
        form_data = {
            "event_main_group": race_name,
            "ranking": "time_finish_netto",
            "search[sex]": "M",
            "search[age_class]": "%",
            "search[nation]": "%",
            "num_results": "25",
            "submit": "Show Results",
        }

        # POST to get results, which will contain the correct event IDs
        self._rate_limit()
        resp = self.client.post(
            f"{self.base_url}?pid=list&pidp=ranking_nav",
            data=form_data,
        )

        result_soup = BeautifulSoup(resp.text, "lxml")
        divisions = []

        div_select = result_soup.find("select", {"name": "event"})
        if div_select:
            for option in div_select.find_all("option"):
                value = option.get("value", "").strip()
                label = option.text.strip()
                if value and not value.startswith("HD") and not value.startswith("HMR"):
                    divisions.append(
                        {
                            "event_id": value,
                            "label": label,
                        }
                    )

        return divisions

    def scrape_list_page(
        self,
        event_id: str,
        gender: str = "M",
        age_group: str = "%",
        page: int = 1,
        num_results: int = 100,
    ) -> tuple[list[AthleteListEntry], int]:
        """Scrape a single page of the results list.

        Returns (athletes, total_pages).
        """
        params = {
            "pid": "list",
            "pidp": "ranking_nav",
            "event": event_id,
            "ranking": "time_finish_netto",
            "search[sex]": gender,
            "search[age_class]": age_group,
            "search[nation]": "%",
            "num_results": str(num_results),
            "page": str(page),
        }

        soup = self._get(f"{self.base_url}?{urlencode(params)}")
        athletes = []

        results_list = soup.find("section")
        if not results_list:
            return [], 0

        rows = results_list.find("ul")
        if not rows:
            return [], 0

        for li in rows.find_all("li"):
            link = li.find("a")
            if not link or "content=detail" not in link.get("href", ""):
                continue

            text_parts = li.get_text(separator="|", strip=True).split("|")
            if len(text_parts) < 4:
                continue

            # Extract ranks (first two numbers)
            ranks = []
            for part in text_parts:
                part = part.strip()
                if part.isdigit():
                    ranks.append(int(part))
                if len(ranks) == 2:
                    break

            name = link.text.strip()

            # Find nationality and age group
            nat = ""
            nat_img = li.find("img")
            if nat_img:
                nat = nat_img.get("title", "").strip()

            # Age group — look for pattern like "16-24", "25-29", etc.
            age = ""
            for part in text_parts:
                part = part.strip()
                if re.match(r"^(U?\d{2,3}|\d{2}-\d{2,3}|\d{2}\+)$", part):
                    age = part
                    break

            # Total time — last time-like part
            total_time = ""
            for part in reversed(text_parts):
                part = part.strip()
                if re.match(r"^\d{2}:\d{2}:\d{2}$", part):
                    total_time = part
                    break

            detail_href = link.get("href", "")
            detail_url = urljoin(self.base_url, detail_href)

            athletes.append(
                AthleteListEntry(
                    name=name,
                    nationality=nat,
                    age_group=age,
                    total_time=total_time,
                    total_time_seconds=parse_time_to_seconds(total_time),
                    overall_rank=ranks[0] if len(ranks) > 0 else None,
                    age_group_rank=ranks[1] if len(ranks) > 1 else None,
                    detail_url=detail_url,
                )
            )

        # Determine total pages from pagination
        total_pages = 1
        pagination = soup.find_all("ul")
        for ul in pagination:
            page_links = ul.find_all("a")
            for a in page_links:
                text = a.text.strip()
                if text.isdigit():
                    total_pages = max(total_pages, int(text))

        return athletes, total_pages

    def scrape_all_athletes(
        self,
        event_id: str,
        gender: str = "M",
        age_group: str = "%",
        max_pages: int = 100,
    ) -> list[AthleteListEntry]:
        """Scrape all pages of results for given filters."""
        all_athletes = []
        page = 1

        while page <= max_pages:
            athletes, total_pages = self.scrape_list_page(
                event_id=event_id,
                gender=gender,
                age_group=age_group,
                page=page,
                num_results=100,
            )

            if not athletes:
                break

            all_athletes.extend(athletes)
            logger.info(
                "Scraped page %d/%d (%d athletes so far)",
                page,
                total_pages,
                len(all_athletes),
            )

            if page >= total_pages:
                break
            page += 1

        return all_athletes

    def scrape_athlete_detail(self, detail_url: str) -> AthleteSplits:
        """Scrape full workout summary for an individual athlete."""
        soup = self._get(detail_url)
        splits = AthleteSplits()

        # Participant info
        participant_table = None
        for h3 in soup.find_all("h3"):
            if "Participant" in h3.text:
                participant_table = h3.find_next("table")
                break

        if participant_table:
            for row in participant_table.find_all("tr"):
                th = row.find("th")
                td = row.find("td")
                if not th or not td:
                    continue
                label = th.text.strip()
                value = td.text.strip()
                if label == "Name":
                    splits.name = value
                elif label == "Bib Number":
                    splits.bib_number = value
                elif label == "Age Group":
                    splits.age_group = value
                elif label == "Nat":
                    splits.nationality = value.strip()

        # Race details
        for h3 in soup.find_all("h3"):
            if "Race Details" in h3.text:
                table = h3.find_next("table")
                if table:
                    for row in table.find_all("tr"):
                        th = row.find("th")
                        td = row.find("td")
                        if not th or not td:
                            continue
                        label = th.text.strip()
                        value = td.text.strip()
                        if label == "Race":
                            splits.race_name = value
                        elif label == "Division":
                            splits.division = value
                break

        # Overall Time section
        for h3 in soup.find_all("h3"):
            if "Overall Time" in h3.text:
                table = h3.find_next("table")
                if table:
                    for row in table.find_all("tr"):
                        th = row.find("th")
                        td = row.find("td")
                        if not th or not td:
                            continue
                        label = th.text.strip()
                        value = td.text.strip()
                        if "Rank (M/W)" in label:
                            try:
                                splits.overall_rank = int(value)
                            except ValueError:
                                pass
                        elif "Rank (AG)" in label:
                            try:
                                splits.age_group_rank = int(value)
                            except ValueError:
                                pass
                        elif label == "Overall Time":
                            splits.total_time_seconds = parse_time_to_seconds(value)
                break

        # Workout summary table
        workout_table = None
        for h3 in soup.find_all("h3"):
            if "Workout summary" in h3.text:
                workout_table = h3.find_next("table")
                break

        if workout_table:
            run_index = 0
            for row in workout_table.find("tbody").find_all("tr"):
                cells = row.find_all(["th", "td"])
                if len(cells) < 2:
                    continue

                split_name = cells[0].text.strip()
                time_val = cells[1].text.strip()
                time_seconds = parse_time_to_seconds(time_val)

                # Running splits
                if split_name.startswith("Running"):
                    if run_index < 8:
                        splits.run_times[f"run{run_index + 1}"] = time_seconds
                    run_index += 1
                # Station splits
                elif split_name == "1000m SkiErg":
                    splits.station_times["skierg"] = time_seconds
                elif split_name == "50m Sled Push":
                    splits.station_times["sled_push"] = time_seconds
                elif split_name == "50m Sled Pull":
                    splits.station_times["sled_pull"] = time_seconds
                elif split_name == "80m Burpee Broad Jump":
                    splits.station_times["burpee_broad_jump"] = time_seconds
                elif split_name == "1000m Row":
                    splits.station_times["row"] = time_seconds
                elif split_name == "200m Farmers Carry":
                    splits.station_times["farmers_carry"] = time_seconds
                elif split_name == "100m Sandbag Lunges":
                    splits.station_times["sandbag_lunges"] = time_seconds
                elif split_name == "Wall Balls":
                    splits.station_times["wall_balls"] = time_seconds
                elif split_name == "Roxzone Time":
                    splits.roxzone_seconds = time_seconds
                elif split_name == "Run Total":
                    splits.run_total_seconds = time_seconds

        return splits

    def search_athlete(
        self,
        event_id: str,
        last_name: str = "",
        first_name: str = "",
        gender: str = "M",
    ) -> list[AthleteListEntry]:
        """Search for an athlete by name in a specific race event."""
        params = {
            "pid": "list",
            "pidp": "ranking_nav",
            "event": event_id,
            "ranking": "time_finish_netto",
            "search[name]": last_name,
            "search[firstname]": first_name,
            "search[sex]": gender,
            "search[age_class]": "%",
            "search[nation]": "%",
            "num_results": "100",
        }

        soup = self._get(f"{self.base_url}?{urlencode(params)}")
        athletes = []

        for li in soup.find_all("li"):
            link = li.find("a")
            if not link or "content=detail" not in link.get("href", ""):
                continue

            text_parts = li.get_text(separator="|", strip=True).split("|")

            ranks = []
            for part in text_parts:
                part = part.strip()
                if part.isdigit():
                    ranks.append(int(part))
                if len(ranks) == 2:
                    break

            name = link.text.strip()

            nat = ""
            nat_img = li.find("img")
            if nat_img:
                nat = nat_img.get("title", "").strip()

            age = ""
            for part in text_parts:
                part = part.strip()
                if re.match(r"^(U?\d{2,3}|\d{2}-\d{2,3}|\d{2}\+)$", part):
                    age = part
                    break

            total_time = ""
            for part in reversed(text_parts):
                part = part.strip()
                if re.match(r"^\d{2}:\d{2}:\d{2}$", part):
                    total_time = part
                    break

            detail_href = link.get("href", "")
            detail_url = urljoin(self.base_url, detail_href)

            athletes.append(
                AthleteListEntry(
                    name=name,
                    nationality=nat,
                    age_group=age,
                    total_time=total_time,
                    total_time_seconds=parse_time_to_seconds(total_time),
                    overall_rank=ranks[0] if len(ranks) > 0 else None,
                    age_group_rank=ranks[1] if len(ranks) > 1 else None,
                    detail_url=detail_url,
                )
            )

        return athletes

    def close(self):
        self.client.close()
