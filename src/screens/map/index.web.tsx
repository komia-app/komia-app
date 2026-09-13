import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";

import { RestaurantCard } from "@/components/restaurant-card";
import { ScreenLoader } from "@/components/screen-loader";
import { useSaveRestaurant } from "@/features/restaurants/mutations";
import { useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing } from "@/theme";
import type { Restaurant } from "@/types/entities";

import { matchesQuery } from "./filter";

// Web is development-only: the map library has no web build, so this lists the same data.
export function MapScreen() {
  const router = useRouter();
  const restaurants = useRestaurants();
  const save = useSaveRestaurant();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => (restaurants.data ?? []).filter((r) => matchesQuery(r, query)),
    [restaurants.data, query],
  );

  const onLog = (r: Restaurant) => router.push({ pathname: "/log-visit", params: { id: r.id } });

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <View style={styles.root}>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search restaurants" style={styles.search} />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onSave={(r) => save.mutate(r)} onLog={onLog} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  search: {
    margin: spacing.lg,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
});
