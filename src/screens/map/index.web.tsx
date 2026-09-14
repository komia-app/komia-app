import { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";

import { RestaurantCard } from "@/components/restaurant-card";
import { ScreenLoader } from "@/components/screen-loader";
import { useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing } from "@/theme";

import { matchesQuery } from "@/features/restaurants/filter";
import { useRestaurantActions } from "@/features/restaurants/use-restaurant-actions";

// Web is development-only: the map library has no web build, so this lists the same data.
export function MapScreen() {
  const restaurants = useRestaurants();
  const { onSave, onLog } = useRestaurantActions();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => (restaurants.data ?? []).filter((r) => matchesQuery(r, query)),
    [restaurants.data, query],
  );

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <View style={styles.root}>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search restaurants" style={styles.search} />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <RestaurantCard restaurant={item} onSave={onSave} onLog={onLog} />}
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
