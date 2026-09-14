import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

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
          <MaterialCommunityIcons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color={n <= value ? colors.yellow : colors.line}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
});
