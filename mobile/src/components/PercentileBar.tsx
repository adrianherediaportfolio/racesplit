import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, spacing } from "../lib/theme";

interface Props {
  station: string;
  percentile: number;
  timeDisplay: string;
  medianDisplay: string;
  top10Display: string;
}

function getColor(p: number): string {
  if (p >= 80) return colors.success;
  if (p >= 60) return "#22d3ee";
  if (p >= 40) return colors.accent;
  if (p >= 20) return colors.warning;
  return colors.danger;
}

export default function PercentileBar({
  station,
  percentile,
  timeDisplay,
  medianDisplay,
  top10Display,
}: Props) {
  const barColor = getColor(percentile);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stationName}>{station}</Text>
        <Text style={[styles.percentileText, { color: barColor }]}>
          Top {Math.round(100 - percentile)}%
        </Text>
      </View>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.min(percentile, 100)}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>You: {timeDisplay}</Text>
        <Text style={styles.detailText}>Median: {medianDisplay}</Text>
        <Text style={styles.detailText}>Top 10%: {top10Display}</Text>
      </View>
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
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  stationName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  percentileText: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  barBg: {
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailText: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
});
