import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, spacing } from "../lib/theme";
import type { Weakness } from "../lib/api";

interface Props {
  weaknesses: Weakness[];
}

export default function WeaknessCard({ weaknesses }: Props) {
  if (weaknesses.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weakness Detector</Text>
      <Text style={styles.subtitle}>
        Stations where you lose the most time vs category median
      </Text>

      {weaknesses.map((w, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{i + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.stationName}>{w.station}</Text>
            <Text style={styles.timeText}>
              Your time: {w.athlete_display} | Median: {w.median_display}
            </Text>
          </View>
          <View style={styles.gapContainer}>
            <Text style={styles.gapText}>+{w.gap_display}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  rankText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  stationName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  timeText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  gapContainer: {
    backgroundColor: "rgba(239,68,68,0.15)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  gapText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
