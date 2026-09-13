import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { colors, radius, spacing, text } from "@/theme";
import type { Restaurant } from "@/types/entities";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSave: (r: Restaurant) => void;
  onLog: (r: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onSave, onLog }: RestaurantCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Image source={restaurant.image_url ? { uri: restaurant.image_url } : undefined} style={styles.image} contentFit="cover" transition={150} />
        <Text style={styles.price}>{restaurant.price_level}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Link href={{ pathname: "/restaurant/[id]", params: { id: restaurant.id } }} style={styles.name}>
              {restaurant.name}
            </Link>
            <Text style={styles.cuisines}>{restaurant.cuisines.join(" / ")}</Text>
          </View>
          {typeof restaurant.average_rating === "number" ? (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>{restaurant.average_rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.address}>
          {[restaurant.neighborhood, restaurant.address].filter(Boolean).join(" / ")}
        </Text>
        <RatingStars value={Math.round(restaurant.average_rating ?? 0)} size={14} />
        <View style={styles.actions}>
          <Pressable style={[styles.action, styles.actionOutline]} onPress={() => onSave(restaurant)}>
            <Text style={styles.actionText}>Save</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.actionFilled]} onPress={() => onLog(restaurant)}>
            <Text style={styles.actionText}>Log visit</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  image: { height: 160, width: "100%", backgroundColor: colors.surfaceMuted },
  price: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...text.caption,
    color: colors.ink,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  titleCol: { flex: 1, gap: spacing.xs },
  name: text.heading,
  cuisines: text.caption,
  ratingPill: {
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  ratingText: text.bodyStrong,
  address: text.caption,
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  actionOutline: { borderWidth: 1, borderColor: colors.line },
  actionFilled: { backgroundColor: colors.yellow },
  actionText: text.bodyStrong,
});
