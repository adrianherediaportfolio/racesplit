import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, fontSize, spacing } from "../lib/theme";
import { register } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Email and password are required");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const data = await register(email.trim(), password);
      await AsyncStorage.setItem("racesplit_token", data.access_token);
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } catch (err) {
      Alert.alert("Registration Failed", String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Sign up to save your race analyses
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.muted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            textContentType="newPassword"
          />

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.foreground,
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
  registerBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  registerBtnText: {
    color: "#000",
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  loginText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  loginHighlight: {
    color: colors.accent,
    fontWeight: "600",
  },
});
