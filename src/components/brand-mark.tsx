import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, inverse && styles.dotInverse]} />
      <Text style={[styles.word, inverse && styles.wordInverse]}>KOMIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: radius.pill, backgroundColor: colors.yellow },
  dotInverse: { backgroundColor: colors.navy },
  word: { fontSize: 20, fontWeight: "900", letterSpacing: 2, color: colors.navy },
  wordInverse: { color: colors.white },
});
