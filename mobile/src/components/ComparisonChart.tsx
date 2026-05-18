import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, fontSize, spacing } from "../lib/theme";
import type { StationStat } from "../lib/api";

interface Props {
  stations: StationStat[];
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function BarGroup({
  station,
  athleteSeconds,
  medianSeconds,
  top10Seconds,
}: {
  station: string;
  athleteSeconds: number;
  medianSeconds: number;
  top10Seconds: number;
}) {
  const maxVal = Math.max(athleteSeconds, medianSeconds, top10Seconds, 1);

  return (
    <View style={styles.barGroup}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {station}
      </Text>
      <View style={styles.barsContainer}>
        <View style={styles.barRow}>
          <View
            style={[
              styles.bar,
              {
                width: `${(athleteSeconds / maxVal) * 100}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
          <Text style={styles.barValue}>{formatTime(athleteSeconds)}</Text>
        </View>
        <View style={styles.barRow}>
          <View
            style={[
              styles.bar,
              {
                width: `${(medianSeconds / maxVal) * 100}%`,
                backgroundColor: colors.muted,
              },
            ]}
          />
          <Text style={styles.barValue}>{formatTime(medianSeconds)}</Text>
        </View>
        <View style={styles.barRow}>
          <View
            style={[
              styles.bar,
              {
                width: `${(top10Seconds / maxVal) * 100}%`,
                backgroundColor: colors.success,
              },
            ]}
          />
          <Text style={styles.barValue}>{formatTime(top10Seconds)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ComparisonChart({ stations }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Station Comparison</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.muted }]} />
          <Text style={styles.legendText}>Median</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Top 10%</Text>
        </View>
      </View>

      <ScrollView nestedScrollEnabled>
        {stations.map((s, i) => (
          <BarGroup
            key={i}
            station={s.station}
            athleteSeconds={s.time_seconds}
            medianSeconds={s.median_seconds}
            top10Seconds={s.top10_seconds}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
  barGroup: {
    marginBottom: spacing.md,
  },
  barLabel: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  barsContainer: {
    gap: 3,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    minWidth: 4,
  },
  barValue: {
    color: colors.muted,
    fontSize: 10,
  },
});
