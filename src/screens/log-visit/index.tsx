import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { useLogVisit } from "@/features/restaurants/mutations";
import { useRestaurant } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function LogVisitScreen({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const restaurant = useRestaurant(restaurantId);
  const logVisit = useLogVisit();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  if (restaurant.isPending) return <ScreenLoader />;
  if (!restaurant.data) {
    return (
      <View style={styles.root}>
        <Text style={styles.muted}>Restaurant not found.</Text>
      </View>
    );
  }
  const r = restaurant.data;

  const submit = async () => {
    try {
      await logVisit.mutateAsync({ restaurant: r, rating, review });
      router.back();
      Alert.alert("Visit added to your log");
    } catch (e) {
      Alert.alert("Could not save the visit", e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.overline}>Log a visit</Text>
      <Text style={styles.name}>{r.name}</Text>
      <Text style={styles.question}>How was it?</Text>
      <RatingStars value={rating} onChange={setRating} size={32} />
      <TextInput
        value={review}
        onChangeText={setReview}
        placeholder="What should your friends know?"
        placeholderTextColor={colors.inkFaint}
        multiline
        style={styles.review}
      />
      <PrimaryButton onPress={() => void submit()} loading={logVisit.isPending}>
        Add to my log
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.md, backgroundColor: colors.surface },
  overline: { ...text.overline, color: colors.orange },
  name: text.title,
  question: { ...text.bodyStrong, marginTop: spacing.sm },
  review: {
    minHeight: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: spacing.lg,
    textAlignVertical: "top",
    ...text.body,
  },
  muted: { ...text.body, color: colors.inkMuted },
});
