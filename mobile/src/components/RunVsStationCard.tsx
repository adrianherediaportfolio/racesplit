import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fontSize, spacing } from "../lib/theme";

interface Props {
  runningDisplay: string;
  stationsDisplay: string;
  runningSeconds: number;
  stationsSeconds: number;
}

export default function RunVsStationCard({
  runningDisplay,
  stationsDisplay,
  runningSeconds,
  stationsSeconds,
}: Props) {
  const total = runningSeconds + stationsSeconds;
  const runPct = total > 0 ? Math.round((runningSeconds / total) * 100) : 50;
  const staPct = 100 - runPct;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Running vs Stations</Text>

      <View style={styles.barBg}>
        <View
          style={[
            styles.barSegment,
            {
              width: `${runPct}%`,
              backgroundColor: colors.info,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            },
          ]}
        />
        <View
          style={[
            styles.barSegment,
            {
              width: `${staPct}%`,
              backgroundColor: colors.accent,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            },
          ]}
        />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailBlock}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.info }]} />
            <Text style={styles.label}>Running</Text>
          </View>
          <Text style={styles.value}>{runningDisplay}</Text>
          <Text style={styles.pct}>{runPct}%</Text>
        </View>
        <View style={styles.detailBlock}>
          <View style={styles.dotRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={styles.label}>Stations</Text>
          </View>
          <Text style={styles.value}>{stationsDisplay}</Text>
          <Text style={styles.pct}>{staPct}%</Text>
        </View>
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
    marginBottom: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  barBg: {
    flexDirection: "row",
    height: 20,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  barSegment: {
    height: 20,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  detailBlock: {
    alignItems: "center",
  },
  dotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  value: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  pct: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
});
