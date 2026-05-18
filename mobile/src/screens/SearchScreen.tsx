import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSize, spacing } from "../lib/theme";
import { searchAthletes, analyzeAthlete } from "../lib/api";
import type { SearchResult, AnalysisResult } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Search">;
};

export default function SearchScreen({ navigation }: Props) {
  const [eventId, setEventId] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!eventId.trim() || !lastName.trim()) {
      Alert.alert("Required", "Event ID and Last Name are required");
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      const data = await searchAthletes(
        eventId.trim(),
        lastName.trim(),
        firstName.trim() || undefined,
        gender || undefined
      );
      setResults(data);
      if (data.length === 0) {
        Alert.alert("No Results", "No athletes found with that name.");
      }
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (athlete: SearchResult) => {
    setAnalyzing(athlete.bib);
    try {
      const analysis = await analyzeAthlete(
        athlete.detail_url,
        eventId.trim(),
        athlete.gender,
        athlete.age_group
      );
      navigation.navigate("Results", { analysis });
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>RaceSplit</Text>
      <Text style={styles.subtitle}>
        Search your race results and get station-by-station performance insights
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Race Event ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. hyrox-world-2024"
          placeholderTextColor={colors.muted}
          value={eventId}
          onChangeText={setEventId}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Athlete last name"
          placeholderTextColor={colors.muted}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          placeholderTextColor={colors.muted}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {["", "M", "F"].map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderBtn,
                gender === g && styles.genderBtnActive,
              ]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === g && styles.genderTextActive,
                ]}
              >
                {g === "" ? "All" : g === "M" ? "Male" : "Female"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.searchBtnText}>Search Athletes</Text>
          )}
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View style={styles.resultsList}>
          <Text style={styles.resultsTitle}>
            {results.length} athlete{results.length !== 1 ? "s" : ""} found
          </Text>
          {results.map((r, i) => (
            <TouchableOpacity
              key={i}
              style={styles.resultCard}
              onPress={() => handleAnalyze(r)}
              disabled={analyzing !== null}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{r.name}</Text>
                <Text style={styles.resultDetail}>
                  Bib #{r.bib} · {r.gender} · {r.age_group}
                </Text>
                <Text style={styles.resultTime}>{r.total_time}</Text>
              </View>
              {analyzing === r.bib ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.analyzeText}>Analyze →</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  title: {
    color: colors.accent,
    fontSize: fontSize.xxl,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  genderRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
  },
  genderBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  genderText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  genderTextActive: {
    color: "#000",
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  searchBtnText: {
    color: "#000",
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  resultsList: {
    marginTop: spacing.sm,
  },
  resultsTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  resultDetail: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  resultTime: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginTop: 4,
  },
  analyzeText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
});
