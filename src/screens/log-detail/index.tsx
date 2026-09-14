import { Image } from "expo-image";
import { Link, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { formatVisitDate } from "@/features/restaurants/history";
import { useLog, useRestaurant } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

const SUB_RATINGS: { key: "food_rating" | "service_rating" | "ambiance_rating" | "value_rating"; label: string }[] = [
  { key: "food_rating", label: "Food" },
  { key: "service_rating", label: "Service" },
  { key: "ambiance_rating", label: "Ambiance" },
  { key: "value_rating", label: "Value" },
];

export function LogDetailScreen({ id }: { id: string }) {
  const log = useLog(id);
  const restaurant = useRestaurant(log.data?.restaurant_id ?? "");

  if (id.length === 0 || log.isError || (!log.isPending && !log.data)) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Log not found.</Text>
      </View>
    );
  }
  if (log.isPending) return <ScreenLoader />;
  const l = log.data;
  const r = restaurant.data;
  const subs = SUB_RATINGS.filter((s) => typeof l[s.key] === "number");

  return (
    <>
      <Stack.Screen.Title>{r?.name ?? "Visit"}</Stack.Screen.Title>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Image source={r?.image_url ? { uri: r.image_url } : undefined} style={styles.hero} contentFit="cover" transition={150} />
        <View style={styles.header}>
          <Link href={{ pathname: "/restaurant/[id]", params: { id: l.restaurant_id } }} style={styles.name}>
            {r?.name ?? "Restaurant"}
          </Link>
          <Text style={styles.date}>{formatVisitDate(l.visited_at)}</Text>
          <View style={styles.ratingRow}>
            <RatingStars value={Math.round(l.overall_rating)} />
            <Text style={styles.ratingText}>{l.overall_rating.toFixed(1)} overall</Text>
          </View>
        </View>

        {subs.length > 0 ? (
          <View style={styles.group}>
            {subs.map((s) => (
              <View key={s.key} style={styles.subRow}>
                <Text style={styles.subLabel}>{s.label}</Text>
                <Text style={styles.subValue}>{Number(l[s.key]).toFixed(1)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {l.review ? (
          <View style={styles.group}>
            <Text style={styles.overline}>Review</Text>
            <Text style={styles.body}>{l.review}</Text>
          </View>
        ) : null}

        {l.dishes && l.dishes.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.overline}>Dishes</Text>
            <View style={styles.chips}>
              {l.dishes.map((d) => (
                <Text key={d} style={styles.chip}>{d}</Text>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.group}>
          {typeof l.price_paid === "number" ? <Fact label="Price paid" value={`$${l.price_paid}`} /> : null}
          {l.occasion ? <Fact label="Occasion" value={l.occasion} /> : null}
          {l.visibility ? <Fact label="Visibility" value={l.visibility} /> : null}
          {typeof l.would_return === "boolean" ? <Fact label="Would return" value={l.would_return ? "Yes" : "No"} /> : null}
        </View>
      </ScrollView>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.subRow}>
      <Text style={styles.subLabel}>{label}</Text>
      <Text style={styles.subValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { height: 200, width: "100%", backgroundColor: colors.surfaceMuted },
  header: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  name: text.title,
  date: text.caption,
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  ratingText: text.caption,
  group: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  subRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  subLabel: { ...text.body, color: colors.inkMuted },
  subValue: text.bodyStrong,
  overline: text.overline,
  body: text.body,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { ...text.caption, color: colors.ink, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...text.body, color: colors.inkMuted },
});
