import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:8000";

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("racesplit_token");
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface Race {
  name: string;
  display_name: string;
}

export interface Division {
  id: string;
  name: string;
}

export interface SearchResult {
  name: string;
  bib: string;
  gender: string;
  age_group: string;
  total_time: string;
  detail_url: string;
}

export interface StationStat {
  station: string;
  time_seconds: number;
  time_display: string;
  percentile: number;
  median_seconds: number;
  median_display: string;
  top10_seconds: number;
  top10_display: string;
}

export interface Weakness {
  station: string;
  athlete_seconds: number;
  athlete_display: string;
  median_seconds: number;
  median_display: string;
  gap_seconds: number;
  gap_display: string;
}

export interface AnalysisResult {
  athlete_name: string;
  bib: string;
  gender: string;
  age_group: string;
  race_event: string;
  total_time: string;
  total_percentile: number;
  stations: StationStat[];
  weaknesses: Weakness[];
  running_total_seconds: number;
  stations_total_seconds: number;
  running_display: string;
  stations_display: string;
  category_size: number;
}

export function getRaces(): Promise<Race[]> {
  return apiFetch("/api/races");
}

export function getDivisions(raceName: string): Promise<Division[]> {
  return apiFetch(`/api/races/${encodeURIComponent(raceName)}/divisions`);
}

export function searchAthletes(
  eventId: string,
  lastName: string,
  firstName?: string,
  gender?: string
): Promise<SearchResult[]> {
  return apiFetch("/api/search", {
    method: "POST",
    body: JSON.stringify({
      event_id: eventId,
      last_name: lastName,
      first_name: firstName || undefined,
      gender: gender || undefined,
    }),
  });
}

export function analyzeAthlete(
  detailUrl: string,
  raceEvent: string,
  gender: string,
  ageGroup: string
): Promise<AnalysisResult> {
  return apiFetch("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      detail_url: detailUrl,
      race_event: raceEvent,
      gender,
      age_group: ageGroup,
    }),
  });
}

export function login(
  email: string,
  password: string
): Promise<{ access_token: string }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  password: string
): Promise<{ access_token: string }> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(): Promise<{
  email: string;
  plan: string;
  analyses_count: number;
}> {
  return apiFetch("/api/auth/me");
}

export interface SavedRace {
  id: number;
  athlete_name: string;
  race_event: string;
  total_time: string;
  total_percentile: number;
  created_at: string;
}

export function getSavedRaces(): Promise<SavedRace[]> {
  return apiFetch("/api/saved-races");
}

export function saveRace(data: {
  athlete_name: string;
  race_event: string;
  total_time: string;
  total_percentile: number;
}): Promise<SavedRace> {
  return apiFetch("/api/saved-races", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteSavedRace(id: number): Promise<void> {
  return apiFetch(`/api/saved-races/${id}`, { method: "DELETE" });
}
