"use client";

import type { Weakness } from "@/lib/api";

interface WeaknessCardProps {
  weaknesses: Weakness[];
}

export default function WeaknessCard({ weaknesses }: WeaknessCardProps) {
  if (weaknesses.length === 0) return null;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--danger)] rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-[var(--danger)]">
        Weakness Detector
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Stations where you lose the most time compared to your category median
      </p>
      <div className="space-y-3">
        {weaknesses.map((w, i) => (
          <div
            key={w.station_key}
            className="flex items-center justify-between bg-[var(--background)] rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[var(--danger)]">
                #{i + 1}
              </span>
              <div>
                <div className="font-medium">{w.station_name}</div>
                <div className="text-xs text-gray-400">
                  Your time: {w.athlete_time_str} | Median: {w.median_str}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[var(--danger)] font-bold">
                +{w.gap_str}
              </div>
              <div className="text-xs text-gray-400">
                Top {w.percentile !== null ? (100 - w.percentile).toFixed(0) : "–"}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
