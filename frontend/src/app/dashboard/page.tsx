"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User, SavedRace } from "@/lib/api";
import { getMe, getSavedRaces, deleteSavedRace } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [savedRaces, setSavedRaces] = useState<SavedRace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("racesplit_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    Promise.all([getMe(token), getSavedRaces(token)])
      .then(([userData, races]) => {
        setUser(userData);
        setSavedRaces(races);
      })
      .catch(() => {
        localStorage.removeItem("racesplit_token");
        localStorage.removeItem("racesplit_user");
        router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("racesplit_token");
    if (!token) return;
    try {
      await deleteSavedRace(id, token);
      setSavedRaces((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm">
            {user?.email} — {user?.is_paid ? "Pro" : "Free"} plan ({user?.race_analyses_count ?? 0}{" "}
            analyses)
          </p>
        </div>
        {!user?.is_paid && (
          <button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-medium px-4 py-2 rounded text-sm transition">
            Upgrade to Pro
          </button>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3">Saved Race Analyses</h2>
      {savedRaces.length === 0 ? (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center text-gray-400">
          <p>No saved races yet.</p>
          <p className="text-sm mt-1">
            Search for an athlete and analyze their race to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedRaces.map((race) => (
            <div
              key={race.id}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{race.athlete_name}</div>
                <div className="text-xs text-gray-400">
                  {race.race_name} — {race.total_time}
                  {race.notes && ` — ${race.notes}`}
                </div>
                <div className="text-xs text-gray-500">
                  Saved: {new Date(race.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleDelete(race.id)}
                className="text-gray-400 hover:text-[var(--danger)] transition text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
