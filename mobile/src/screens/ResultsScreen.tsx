import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, fontSize, spacing } from "../lib/theme";
import PercentileBar from "../components/PercentileBar";
import WeaknessCard from "../components/WeaknessCard";
import ComparisonChart from "../components/ComparisonChart";
import RunVsStationCard from "../components/RunVsStationCard";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Results">;

function getPercentileColor(p: number): string {
  if (p >= 80) return colors.success;
  if (p >= 60) return "#22d3ee";
  if (p >= 40) return colors.accent;
  if (p >= 20) return colors.warning;
  return colors.danger;
}

export default function ResultsScreen({ route }: Props) {
  const { analysis } = route.params;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.athleteName}>{analysis.athlete_name}</Text>
        <Text style={styles.athleteDetail}>
          Bib #{analysis.bib} · {analysis.gender} · {analysis.age_group}
        </Text>
        <Text style={styles.raceEvent}>{analysis.race_event}</Text>

        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <Text style={styles.overallLabel}>Total Time</Text>
            <Text style={styles.overallTime}>{analysis.total_time}</Text>
          </View>
          <View style={styles.overallRight}>
            <Text style={styles.overallLabel}>Overall Rank</Text>
            <Text
              style={[
                styles.overallPercentile,
                { color: getPercentileColor(analysis.total_percentile) },
              ]}
            >
              Top {Math.round(100 - analysis.total_percentile)}%
            </Text>
          </View>
        </View>
        <Text style={styles.categoryNote}>
          vs {analysis.category_size} athletes in your category
        </Text>
      </View>

      {/* Weakness Detector */}
      <WeaknessCard weaknesses={analysis.weaknesses} />

      {/* Running vs Stations */}
      <RunVsStationCard
        runningDisplay={analysis.running_display}
        stationsDisplay={analysis.stations_display}
        runningSeconds={analysis.running_total_seconds}
        stationsSeconds={analysis.stations_total_seconds}
      />

      {/* Comparison Chart */}
      <ComparisonChart stations={analysis.stations} />

      {/* Station Percentiles */}
      <Text style={styles.sectionTitle}>Station Breakdown</Text>
      {analysis.stations.map((s, i) => (
        <PercentileBar
          key={i}
          station={s.station}
          percentile={s.percentile}
          timeDisplay={s.time_display}
          medianDisplay={s.median_display}
          top10Display={s.top10_display}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  athleteName: {
    color: colors.foreground,
    fontSize: fontSize.xxl,
    fontWeight: "800",
  },
  athleteDetail: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  raceEvent: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  overallCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    flexDirection: "row",
  },
  overallLeft: {
    flex: 1,
  },
  overallRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  overallLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  overallTime: {
    color: colors.foreground,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  overallPercentile: {
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  categoryNote: {
    color: colors.muted,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
});
