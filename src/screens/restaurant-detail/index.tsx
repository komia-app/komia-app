import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { useSaveRestaurant } from "@/features/restaurants/mutations";
import { useRestaurant } from "@/features/restaurants/queries";
import { colors, spacing, text } from "@/theme";

import { InfoRows } from "./info-rows";

export function RestaurantDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const restaurant = useRestaurant(id);
  const save = useSaveRestaurant();

  if (restaurant.isPending) return <ScreenLoader />;
  if (!restaurant.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Restaurant not found.</Text>
      </View>
    );
  }
  const r = restaurant.data;

  const onSave = async () => {
    const result = await save.mutateAsync(r);
    Alert.alert(result === "saved" ? "Saved to Want to try" : "Already in Want to try");
  };

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Image source={r.image_url ? { uri: r.image_url } : undefined} style={styles.hero} contentFit="cover" transition={150} />
        <View style={styles.header}>
          <Text style={styles.name}>{r.name}</Text>
          <View style={styles.ratingRow}>
            <RatingStars value={Math.round(r.average_rating ?? 0)} />
            {typeof r.average_rating === "number" ? (
              <Text style={styles.ratingText}>
                {r.average_rating.toFixed(1)} ({r.rating_count ?? 0})
              </Text>
            ) : null}
          </View>
          {r.description ? <Text style={styles.description}>{r.description}</Text> : null}
        </View>
        <InfoRows restaurant={r} />
      </ScrollView>
      <Stack.Screen.Title>{r.name}</Stack.Screen.Title>
      {Platform.OS === "android" ? (
        // Stack.Toolbar.Button ignores SF Symbol icons on Android (it needs an ImageSourcePropType),
        // so the header buttons render as plain text there instead.
        <Stack.Screen
          options={{
            headerRight: () => (
              <View style={styles.headerButtons}>
                <Pressable onPress={() => void onSave()} hitSlop={8}>
                  <Text style={styles.headerButtonText}>Save</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: "/log-visit", params: { id: r.id } })}
                  hitSlop={8}
                >
                  <Text style={styles.headerButtonText}>Log</Text>
                </Pressable>
              </View>
            ),
          }}
        />
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button icon="bookmark" onPress={() => void onSave()} />
          <Stack.Toolbar.Button icon="plus.circle" onPress={() => router.push({ pathname: "/log-visit", params: { id: r.id } })} />
        </Stack.Toolbar>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { height: 240, width: "100%", backgroundColor: colors.surfaceMuted },
  header: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  name: text.title,
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ratingText: text.caption,
  description: { ...text.body, color: colors.inkMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...text.body, color: colors.inkMuted },
  headerButtons: { flexDirection: "row", gap: spacing.lg, paddingRight: spacing.sm },
  headerButtonText: { ...text.bodyStrong, color: colors.navy },
});
