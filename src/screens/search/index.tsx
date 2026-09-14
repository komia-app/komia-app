import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { MiaCard } from "@/components/mia-card";
import { RestaurantCard } from "@/components/restaurant-card";
import { ScreenLoader } from "@/components/screen-loader";
import { matchesQuery } from "@/features/restaurants/filter";
import { useRestaurants } from "@/features/restaurants/queries";
import { useRestaurantActions } from "@/features/restaurants/use-restaurant-actions";
import { spacing, text } from "@/theme";

export function SearchScreen() {
  const restaurants = useRestaurants();
  const { onSave, onLog } = useRestaurantActions();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      (restaurants.data ?? [])
        .filter((r) => matchesQuery(r, query))
        .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)),
    [restaurants.data, query],
  );

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <>
      <Stack.SearchBar placeholder="Cuisine, restaurant, neighborhood" onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling={false} />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <MiaCard />
            <View style={styles.titleRow}>
              <Text style={styles.title}>Top picks</Text>
              <Text style={styles.count}>{visible.length} places</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No restaurants match your search.</Text>}
        renderItem={({ item }) => <RestaurantCard restaurant={item} onSave={onSave} onLog={onLog} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.lg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: text.heading,
  count: text.caption,
  empty: { ...text.caption, textAlign: "center", padding: spacing.xl },
});
