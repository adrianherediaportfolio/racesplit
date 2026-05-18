"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StationPercentile } from "@/lib/api";

interface ComparisonChartProps {
  stations: StationPercentile[];
  athleteName: string;
}

const SHORT_NAMES: Record<string, string> = {
  "1000m SkiErg": "SkiErg",
  "50m Sled Push": "Sled Push",
  "50m Sled Pull": "Sled Pull",
  "80m Burpee Broad Jump": "Burpees",
  "1000m Row": "Row",
  "200m Farmers Carry": "Farmers",
  "100m Sandbag Lunges": "Lunges",
  "Wall Balls": "Wall Balls",
};

export default function ComparisonChart({
  stations,
  athleteName,
}: ComparisonChartProps) {
  const data = stations.map((s) => ({
    name: SHORT_NAMES[s.station_name] || s.station_name,
    Athlete: s.athlete_time_seconds ? Math.round(s.athlete_time_seconds) : 0,
    Median: s.median_seconds ? Math.round(s.median_seconds) : 0,
    "Top 10%": s.top10_seconds ? Math.round(s.top10_seconds) : 0,
  }));

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">
        {athleteName} vs Category
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            label={{
              value: "Seconds",
              angle: -90,
              position: "insideLeft",
              fill: "#9ca3af",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
            formatter={(value) => {
              const num = Number(value) || 0;
              const min = Math.floor(num / 60);
              const sec = num % 60;
              return `${min}:${sec.toString().padStart(2, "0")}`;
            }}
          />
          <Legend />
          <Bar dataKey="Athlete" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Median" fill="#6b7280" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Top 10%" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
