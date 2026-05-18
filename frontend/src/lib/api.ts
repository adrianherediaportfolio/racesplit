const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// --- Types ---
export interface RaceEvent {
  name: string;
  event_id: string | null;
  label: string | null;
}

export interface Division {
  event_id: string;
  label: string;
}

export interface AthleteSearchResult {
  name: string;
  nationality: string;
  age_group: string;
  total_time: string;
  total_time_seconds: number | null;
  overall_rank: number | null;
  age_group_rank: number | null;
  detail_url: string;
}

export interface StationPercentile {
  station_name: string;
  station_key: string;
  athlete_time_seconds: number | null;
  athlete_time_str: string;
  percentile: number | null;
  rank: number | null;
  total_in_category: number;
  median_seconds: number | null;
  median_str: string;
  top10_seconds: number | null;
  top10_str: string;
}

export interface Weakness {
  station_name: string;
  station_key: string;
  athlete_time_seconds: number | null;
  athlete_time_str: string;
  median_seconds: number | null;
  median_str: string;
  gap_seconds: number;
  gap_str: string;
  percentile: number | null;
}

export interface AnalysisResult {
  athlete_name: string;
  bib_number: string;
  gender: string;
  age_group: string;
  nationality: string;
  total_time_seconds: number | null;
  total_time_str: string;
  overall_rank: number | null;
  age_group_rank: number | null;
  station_percentiles: StationPercentile[];
  weaknesses: Weakness[];
  run_total_seconds: number | null;
  run_total_str: string;
  station_total_seconds: number | null;
  station_total_str: string;
  total_in_category: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_paid: boolean;
  race_analyses_count: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SavedRace {
  id: number;
  athlete_result_id: number;
  athlete_name: string;
  race_name: string;
  total_time: string;
  notes: string | null;
  created_at: string;
}

// --- API Functions ---
export async function getRaces(): Promise<RaceEvent[]> {
  return apiFetch("/races");
}

export async function getDivisions(raceName: string): Promise<Division[]> {
  return apiFetch(`/races/${encodeURIComponent(raceName)}/divisions`);
}

export async function searchAthletes(params: {
  event_id: string;
  last_name?: string;
  first_name?: string;
  gender?: string;
}): Promise<AthleteSearchResult[]> {
  return apiFetch("/search", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function analyzeAthlete(params: {
  event_id: string;
  last_name?: string;
  first_name?: string;
  gender?: string;
  detail_url?: string;
  token?: string;
}): Promise<AnalysisResult> {
  const { token, ...body } = params;
  return apiFetch(`/analyze?detail_url=${encodeURIComponent(body.detail_url || "")}`, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export async function register(params: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthResponse> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function login(params: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getMe(token: string): Promise<User> {
  return apiFetch("/auth/me", { token });
}

export async function getSavedRaces(token: string): Promise<SavedRace[]> {
  return apiFetch("/saved-races", { token });
}

export async function saveRace(
  athleteResultId: number,
  notes: string,
  token: string,
): Promise<void> {
  return apiFetch("/saved-races", {
    method: "POST",
    body: JSON.stringify({ athlete_result_id: athleteResultId, notes }),
    token,
  });
}

export async function deleteSavedRace(id: number, token: string): Promise<void> {
  return apiFetch(`/saved-races/${id}`, {
    method: "DELETE",
    token,
  });
}
