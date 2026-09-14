import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useCurrentUser } from "@/features/auth/session-provider";
import { useUpdateProfile } from "@/features/profile/mutations";
import { colors, spacing, text } from "@/theme";

export function EditProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const [homeCity, setHomeCity] = useState(user?.home_city ?? "");
  const [cuisines, setCuisines] = useState((user?.favorite_cuisines ?? []).join(", "));

  const save = async () => {
    try {
      await update.mutateAsync({
        home_city: homeCity.trim(),
        favorite_cuisines: cuisines.split(",").map((c) => c.trim()).filter(Boolean),
      });
      router.back();
    } catch (e) {
      Alert.alert("Could not update your profile", e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.overline}>Profile</Text>
      <Text style={styles.title}>Edit profile</Text>
      <TextField label="Name" value={user?.full_name ?? ""} editable={false} />
      <TextField label="Home city" value={homeCity} onChangeText={setHomeCity} placeholder="e.g. Bogota" />
      <TextField label="Favorite cuisines" value={cuisines} onChangeText={setCuisines} placeholder="Italian, Japanese" autoCapitalize="words" />
      <PrimaryButton onPress={() => void save()} loading={update.isPending}>
        Save
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.surface },
  overline: { ...text.overline, color: colors.orange },
  title: text.title,
});
