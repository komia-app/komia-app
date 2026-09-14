import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";
import type { Restaurant } from "@/types/entities";

const ATTRIBUTES: { key: keyof Restaurant; label: string }[] = [
  { key: "vegetarian_friendly", label: "Vegetarian friendly" },
  { key: "vegan_friendly", label: "Vegan friendly" },
  { key: "outdoor_seating", label: "Outdoor seating" },
  { key: "fine_dining", label: "Fine dining" },
  { key: "casual", label: "Casual" },
  { key: "romantic", label: "Romantic" },
  { key: "family_friendly", label: "Family friendly" },
];

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === "") return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

export function InfoRows({ restaurant }: { restaurant: Restaurant }) {
  const attributes = ATTRIBUTES.filter((a) => restaurant[a.key] === true);
  return (
    <View style={styles.group}>
      <Row label="Address" value={[restaurant.address, restaurant.neighborhood, restaurant.city].filter(Boolean).join(", ")} />
      <Row label="Cuisine" value={[...restaurant.cuisines, ...(restaurant.secondary_cuisines ?? [])].join(", ")} />
      <Row label="Price" value={restaurant.price_level} />
      <Row label="Type" value={restaurant.restaurant_type} />
      <Row label="Hours" value={restaurant.opening_hours} />
      <Row label="Phone" value={restaurant.phone} />
      <Row label="Website" value={restaurant.website} />
      <Row label="Awards" value={restaurant.awards?.join(", ")} />
      {attributes.length > 0 ? (
        <View style={styles.chips}>
          {attributes.map((a) => (
            <Text key={a.key} style={styles.chip}>
              {a.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.xs },
  label: text.overline,
  value: text.bodyStrong,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    ...text.caption,
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
