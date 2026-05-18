"""Tests for the analysis service — percentile calculation logic."""

from src.services.analysis import calculate_percentile


class TestPercentileCalculation:
    def test_fastest_athlete(self):
        """Fastest athlete should be in ~top 100%."""
        result = calculate_percentile(100, [100, 200, 300, 400, 500])
        assert result == 80.0  # 4 out of 5 are slower

    def test_slowest_athlete(self):
        """Slowest athlete should be in ~top 0%."""
        result = calculate_percentile(500, [100, 200, 300, 400, 500])
        assert result == 0.0  # nobody is slower

    def test_median_athlete(self):
        """Median athlete should be around 50%."""
        result = calculate_percentile(300, [100, 200, 300, 400, 500])
        assert result == 40.0  # 2 out of 5 are slower

    def test_single_athlete(self):
        result = calculate_percentile(100, [100])
        assert result == 0.0

    def test_empty_list(self):
        result = calculate_percentile(100, [])
        assert result == 0.0

    def test_all_same_times(self):
        result = calculate_percentile(100, [100, 100, 100, 100])
        assert result == 0.0

    def test_second_fastest(self):
        result = calculate_percentile(150, [100, 150, 200, 300, 400, 500, 600, 700, 800, 900])
        assert result == 80.0  # 8 out of 10 are slower

    def test_top_10_percent(self):
        """Top 10% athlete should have ~90% percentile."""
        times = list(range(100, 1100, 100))  # 100, 200, ..., 1000
        result = calculate_percentile(100, times)
        assert result == 90.0  # 9 out of 10 slower
