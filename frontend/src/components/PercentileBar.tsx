"use client";

interface PercentileBarProps {
  label: string;
  percentile: number | null;
  athleteTime: string;
  medianTime: string;
  top10Time: string;
  rank: number | null;
  total: number;
}

function getColor(p: number): string {
  if (p >= 80) return "var(--success)";
  if (p >= 60) return "#86efac";
  if (p >= 40) return "var(--warning)";
  if (p >= 20) return "#fb923c";
  return "var(--danger)";
}

export default function PercentileBar({
  label,
  percentile,
  athleteTime,
  medianTime,
  top10Time,
  rank,
  total,
}: PercentileBarProps) {
  const pct = percentile ?? 0;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-gray-400">
          {rank ?? "–"}/{total}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg font-bold" style={{ color: getColor(pct) }}>
          {athleteTime}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            backgroundColor: getColor(pct),
            color: "#000",
          }}
        >
          Top {(100 - pct).toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: getColor(pct),
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Median: {medianTime}</span>
        <span>Top 10%: {top10Time}</span>
      </div>
    </div>
  );
}
