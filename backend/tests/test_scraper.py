"""Tests for the scraper module — parsing logic only (no live HTTP)."""

from src.scraper.hyrox import parse_time_to_seconds, seconds_to_time_str


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
