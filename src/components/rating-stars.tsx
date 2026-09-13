import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function RatingStars({ value, onChange, size = 20 }: RatingStarsProps) {
  return (
    <View style={styles.row} accessibilityRole={onChange ? "adjustable" : "text"} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} disabled={!onChange} hitSlop={6}>
          <Text style={[styles.star, { fontSize: size }, n <= value ? styles.on : styles.off]}>*</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  star: { fontWeight: "900", lineHeight: 24 },
  on: { color: colors.yellow },
  off: { color: colors.line },
});
