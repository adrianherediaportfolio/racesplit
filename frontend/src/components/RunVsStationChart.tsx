"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface RunVsStationChartProps {
  runSeconds: number | null;
  stationSeconds: number | null;
  runStr: string;
  stationStr: string;
}

export default function RunVsStationChart({
  runSeconds,
  stationSeconds,
  runStr,
  stationStr,
}: RunVsStationChartProps) {
  if (!runSeconds || !stationSeconds) return null;

  const total = runSeconds + stationSeconds;
  const runPct = ((runSeconds / total) * 100).toFixed(1);
  const stationPct = ((stationSeconds / total) * 100).toFixed(1);

  const data = [
    { name: "Running", value: Math.round(runSeconds) },
    { name: "Stations", value: Math.round(stationSeconds) },
  ];

  const COLORS = ["#3b82f6", "#f59e0b"];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Running vs Stations</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Running: {runStr} ({runPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--accent)]" />
            <span>Stations: {stationStr} ({stationPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
