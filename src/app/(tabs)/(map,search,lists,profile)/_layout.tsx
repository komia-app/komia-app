import { Stack } from "expo-router";

import { colors } from "@/theme";

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
      <Stack.Screen name={screen} options={{ title: titles[screen], headerLargeTitleEnabled: true }} />
      <Stack.Screen name="restaurant/[id]" options={{ title: "" }} />
      <Stack.Screen name="log/[id]" options={{ title: "" }} />
    </Stack>
  );
}
