import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSize, spacing } from "../lib/theme";
import { getMe, getSavedRaces, deleteSavedRace } from "../lib/api";
import type { SavedRace } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Dashboard">;
};

export default function DashboardScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");
  const [analysesCount, setAnalysesCount] = useState(0);
  const [savedRaces, setSavedRaces] = useState<SavedRace[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [me, races] = await Promise.all([getMe(), getSavedRaces()]);
          if (active) {
            setEmail(me.email);
            setPlan(me.plan);
            setAnalysesCount(me.analyses_count);
            setSavedRaces(races);
          }
        } catch {
          const token = await AsyncStorage.getItem("racesplit_token");
          if (!token) {
            navigation.replace("Login");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [navigation])
  );

  const handleDelete = async (id: number) => {
    Alert.alert("Delete", "Remove this saved analysis?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedRace(id);
            setSavedRaces((prev) => prev.filter((r) => r.id !== id));
          } catch (err) {
            Alert.alert("Error", String(err));
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("racesplit_token");
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{plan.toUpperCase()}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{analysesCount}</Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Saved Analyses</Text>

      {savedRaces.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No saved analyses yet. Search and analyze an athlete to save results.
          </Text>
        </View>
      ) : (
        savedRaces.map((race) => (
          <View key={race.id} style={styles.raceCard}>
            <View style={styles.raceInfo}>
              <Text style={styles.raceName}>{race.athlete_name}</Text>
              <Text style={styles.raceEvent}>{race.race_event}</Text>
              <Text style={styles.raceTime}>
                {race.total_time} · Top{" "}
                {Math.round(100 - race.total_percentile)}%
              </Text>
              <Text style={styles.raceDate}>
                {new Date(race.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(race.id)}
            >
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  email: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  statBlock: {
    alignItems: "center",
  },
  statValue: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: "800",
  },
  statLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: colors.cardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  raceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  raceInfo: {
    flex: 1,
  },
  raceName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  raceEvent: {
    color: colors.accent,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  raceTime: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  raceDate: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: colors.danger,
    fontSize: fontSize.xl,
    fontWeight: "700",
    lineHeight: 24,
  },
});
