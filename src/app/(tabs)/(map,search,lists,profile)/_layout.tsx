import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

export const unstable_settings = {
  map: { anchor: "map" },
  search: { anchor: "search" },
  lists: { anchor: "lists" },
  profile: { anchor: "profile" },
};

const titles: Record<string, string> = {
  map: "Map",
  search: "Search",
  lists: "My logs",
  profile: "Profile",
};

export default function TabStackLayout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1] ?? "map";

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.navy,
        headerTitleStyle: { color: colors.navy },
        headerLargeTitleStyle: { color: colors.navy },
        headerStyle: { backgroundColor: colors.surface },
        contentStyle: { backgroundColor: colors.surface },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name={screen}
        options={{
          title: titles[screen],
          headerLargeTitleEnabled: true,
          headerRight: () => (
            <Link href="/mia" asChild>
              <Pressable hitSlop={8} style={styles.mia}>
                <Text style={styles.miaText}>MIA</Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen name="restaurant/[id]" options={{ title: "" }} />
      <Stack.Screen name="log/[id]" options={{ title: "" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  mia: { backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  miaText: { ...text.caption, color: colors.white },
});
