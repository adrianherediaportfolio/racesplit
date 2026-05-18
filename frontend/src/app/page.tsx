"use client";

import { useState } from "react";
import type { AnalysisResult, AthleteSearchResult } from "@/lib/api";
import { searchAthletes, analyzeAthlete } from "@/lib/api";
import PercentileBar from "@/components/PercentileBar";
import ComparisonChart from "@/components/ComparisonChart";
import WeaknessCard from "@/components/WeaknessCard";
import RunVsStationChart from "@/components/RunVsStationChart";

export default function Home() {
  const [eventId, setEventId] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState("M");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<AthleteSearchResult[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"search" | "results" | "analysis">("search");
  const [analyzingName, setAnalyzingName] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const results = await searchAthletes({
        event_id: eventId,
        last_name: lastName,
        first_name: firstName,
        gender,
      });
      setSearchResults(results);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (athlete: AthleteSearchResult) => {
    setError("");
    setLoading(true);
    setAnalyzingName(athlete.name);
    try {
      const token = localStorage.getItem("racesplit_token") || undefined;
      const result = await analyzeAthlete({
        event_id: eventId,
        last_name: lastName,
        first_name: firstName,
        gender,
        detail_url: athlete.detail_url,
        token,
      });
      setAnalysis(result);
      setStep("analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "analysis") {
      setStep("results");
      setAnalysis(null);
    } else {
      setStep("search");
      setSearchResults([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {step !== "search" && (
        <button
          onClick={handleBack}
          className="mb-4 text-[var(--accent)] hover:underline text-sm flex items-center gap-1"
        >
          &larr; Back
        </button>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {step === "search" && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--accent)] mb-2">
              RaceSplit
            </h1>
            <p className="text-gray-400">
              Analyze your race performance station by station
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Event ID
              </label>
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="e.g. LR3MS4JI4EC691"
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Find the event ID from results.hyrox.com URL parameters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Smith"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="M">Men</option>
                <option value="W">Women</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !eventId}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-medium py-2.5 rounded transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Athlete"}
            </button>
          </form>
        </div>
      )}

      {step === "results" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">
            Search Results ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-gray-400">No athletes found. Try different search criteria.</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((athlete, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnalyze(athlete)}
                  disabled={loading}
                  className="w-full text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 hover:border-[var(--accent)] transition disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{athlete.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {athlete.nationality}
                      </span>
                    </div>
                    <span className="text-[var(--accent)] font-mono">
                      {athlete.total_time}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Age Group: {athlete.age_group} | Rank: #{athlete.overall_rank ?? "–"}
                  </div>
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="text-center py-8">
              <div className="text-[var(--accent)] text-lg mb-2">
                Analyzing {analyzingName}...
              </div>
              <p className="text-gray-400 text-sm">
                Fetching split data for comparison. This may take a minute for first-time category analysis.
              </p>
            </div>
          )}
        </div>
      )}

      {step === "analysis" && analysis && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{analysis.athlete_name}</h2>
                <p className="text-gray-400 text-sm">
                  {analysis.gender === "M" ? "Men" : "Women"} {analysis.age_group}{" "}
                  | {analysis.nationality}
                  {analysis.bib_number && ` | Bib #${analysis.bib_number}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[var(--accent)]">
                  {analysis.total_time_str}
                </div>
                <p className="text-gray-400 text-sm">
                  Overall #{analysis.overall_rank ?? "–"} | AG #{analysis.age_group_rank ?? "–"}
                  {" "}of {analysis.total_in_category}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              Station-by-Station Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.station_percentiles.map((sp) => (
                <PercentileBar
                  key={sp.station_key}
                  label={sp.station_name}
                  percentile={sp.percentile}
                  athleteTime={sp.athlete_time_str}
                  medianTime={sp.median_str}
                  top10Time={sp.top10_str}
                  rank={sp.rank}
                  total={sp.total_in_category}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeaknessCard weaknesses={analysis.weaknesses} />
            <RunVsStationChart
              runSeconds={analysis.run_total_seconds}
              stationSeconds={analysis.station_total_seconds}
              runStr={analysis.run_total_str}
              stationStr={analysis.station_total_str}
            />
          </div>

          <ComparisonChart
            stations={analysis.station_percentiles}
            athleteName={analysis.athlete_name}
          />
        </div>
      )}
    </div>
  );
}
