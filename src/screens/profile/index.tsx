import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenLoader } from "@/components/screen-loader";
import { useCurrentUser, useSession } from "@/features/auth/session-provider";
import { computeLogStats, computeTasteProfile } from "@/features/profile/taste-profile";
import { useMyLogs, useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const { signOut } = useSession();
  const logs = useMyLogs();
  const restaurants = useRestaurants();

  const stats = useMemo(() => computeLogStats(logs.data ?? []), [logs.data]);
  const taste = useMemo(() => computeTasteProfile(logs.data ?? [], restaurants.data ?? [], user), [logs.data, restaurants.data, user]);

  if (!user || logs.isPending) return <ScreenLoader />;

  const initial = (user.full_name || user.email || "K")[0].toUpperCase();
  const username = "@" + user.email.split("@")[0];

  const confirmLogout = () =>
    Alert.alert("Log out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user.full_name || "Food explorer"}</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Logged" value={String(stats.logged)} />
        <Stat label="Reviews" value={String(stats.reviews)} />
        <Stat label="Avg rating" value={stats.average} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MIA taste profile</Text>
        <Taste label="Favorite cuisines" items={taste.favorite_cuisines} />
        <Taste label="Preferred price range" items={taste.preferred_price} />
        <Taste label="Favorite restaurant types" items={taste.favorite_types} />
        <Taste label="Preferred locations" items={taste.preferred_locations} />
        {stats.logged === 0 ? <Text style={styles.hint}>Log restaurants to unlock your taste profile.</Text> : null}
      </View>

      <View style={styles.rows}>
        <Row label="Edit profile" onPress={() => router.push("/edit-profile")} />
        <Row label="Log out" onPress={confirmLogout} destructive />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Taste({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.taste}>
      <Text style={styles.overline}>{label}</Text>
      <View style={styles.chips}>
        {items.length ? items.map((t) => <Text key={t} style={styles.chip}>{t}</Text>) : <Text style={styles.hint}>Nothing yet</Text>}
      </View>
    </View>
  );
}

function Row({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowLabel, destructive && styles.rowDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "900", color: colors.navy },
  name: text.title,
  username: text.caption,
  stats: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", gap: spacing.xs },
  statValue: { fontSize: 22, fontWeight: "900", color: colors.navy },
  statLabel: text.overline,
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  cardTitle: text.heading,
  taste: { gap: spacing.xs },
  overline: text.overline,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { ...text.caption, color: colors.ink, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  hint: text.caption,
  rows: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  row: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: text.bodyStrong,
  rowDanger: { color: colors.danger },
});
