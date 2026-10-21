"""Tests for the scraper module — parsing logic only (no live HTTP)."""

from pathlib import Path

from bs4 import BeautifulSoup

from src.scraper.hyrox import (
    HyroxScraper,
    parse_time_to_seconds,
    seconds_to_time_str,
)

FIXTURE_DIR = Path(__file__).parent / "fixtures"


class TestTimeConversion:
    def test_parse_hhmmss(self):
        assert parse_time_to_seconds("01:23:45") == 5025

    def test_parse_mmss(self):
        assert parse_time_to_seconds("03:55") == 235

    def test_parse_zero(self):
        assert parse_time_to_seconds("00:00:00") == 0

    def test_parse_dash(self):
        assert parse_time_to_seconds("–") is None

    def test_parse_empty(self):
        assert parse_time_to_seconds("") is None

    def test_parse_none(self):
        assert parse_time_to_seconds(None) is None

    def test_seconds_to_str_minutes(self):
        assert seconds_to_time_str(235) == "03:55"

    def test_seconds_to_str_hours(self):
        assert seconds_to_time_str(5025) == "01:23:45"

    def test_seconds_to_str_none(self):
        assert seconds_to_time_str(None) == "–"

    def test_seconds_to_str_zero(self):
        assert seconds_to_time_str(0) == "00:00"

    def test_roundtrip_hhmmss(self):
        original = "01:15:30"
        seconds = parse_time_to_seconds(original)
        result = seconds_to_time_str(seconds)
        assert result == original

    def test_roundtrip_mmss(self):
        original = "04:22"
        seconds = parse_time_to_seconds(original)
        result = seconds_to_time_str(seconds)
        assert result == original


def test_scrapes_current_results_markup(monkeypatch):
    soup = BeautifulSoup(
        (FIXTURE_DIR / "hyrox_results_list.html").read_text(),
        "lxml",
    )
    scraper = HyroxScraper()
    monkeypatch.setattr(scraper, "_get", lambda _: soup)

    entries, pages = scraper.scrape_list_page("HPRO_ARN25_OVERALL")
    matches = scraper.search_athlete("HPRO_ARN25_OVERALL", last_name="Weindl")

    assert pages == 14
    assert len(entries) == 1
    assert entries[0].name == "Weindl, Paul (GER)"
    assert entries[0].age_group == "25-29"
    assert entries[0].total_time_seconds == 3303
    assert entries[0].overall_rank == 1
    assert len(matches) == 1
    assert matches[0].name == "Weindl, Paul (GER)"

    scraper.client.close()


def test_scrapes_current_participant_markup(monkeypatch):
    soup = BeautifulSoup(
        (FIXTURE_DIR / "hyrox_participant.html").read_text(),
        "lxml",
    )
    scraper = HyroxScraper()
    monkeypatch.setattr(scraper, "_get", lambda _: soup)

    detail = scraper.scrape_athlete_detail("https://example.com/detail")

    assert detail.name == "Weindl, Paul (GER)"
    assert detail.bib_number == "170039"
    assert detail.age_group == "25-29"
    assert detail.nationality == "GER"

    scraper.client.close()
