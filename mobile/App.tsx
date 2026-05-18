import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { colors } from "./src/lib/theme";
import SearchScreen from "./src/screens/SearchScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import type { RootStackParamList } from "./src/navigation/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Search: "🔍",
    Dashboard: "📊",
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "•"}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.foreground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerTitle: "RaceSplit" }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerTitle: "My Dashboard" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ headerTitle: "Analysis Results" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerTitle: "Sign In" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerTitle: "Create Account" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
