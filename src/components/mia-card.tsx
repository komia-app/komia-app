import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

export function MiaCard() {
  return (
    <Link href="/mia" asChild>
      <Pressable style={styles.card}>
        <Text style={styles.overline}>Meet MIA</Text>
        <Text style={styles.title}>Recommendations made for you</Text>
        <Text style={styles.body}>Every rating and restaurant you save helps MIA learn your cuisines, price range, neighborhoods, and dining style.</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Ask MIA</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  overline: { ...text.overline, color: colors.yellow },
  title: { ...text.heading, color: colors.white },
  body: { ...text.body, color: colors.white, opacity: 0.8 },
  cta: { alignSelf: "flex-start", backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  ctaText: { ...text.bodyStrong, color: colors.white },
});
