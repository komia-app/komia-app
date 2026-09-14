import { Link } from "expo-router";
import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { formatVisitDate, groupLogsByMonth, parseVisitDate } from "@/features/restaurants/history";
import { useMyListItems, useMyLogs, useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function MyLogsScreen() {
  const logs = useMyLogs();
  const saved = useMyListItems();
  const restaurants = useRestaurants();

  const nameById = useMemo(() => new Map((restaurants.data ?? []).map((r) => [r.id, r.name])), [restaurants.data]);
  const sections = useMemo(() => groupLogsByMonth(logs.data ?? []), [logs.data]);

  if (logs.isPending || saved.isPending) return <ScreenLoader />;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(l) => l.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshing={logs.isRefetching}
      onRefresh={() => void logs.refetch()}
      ListHeaderComponent={
        <View style={styles.stats}>
          <View style={[styles.stat, styles.statNavy]}>
            <Text style={[styles.statValue, styles.onNavy]}>{saved.data?.length ?? 0}</Text>
            <Text style={[styles.statLabel, styles.onNavy]}>Want to try</Text>
          </View>
          <View style={[styles.stat, styles.statYellow]}>
            <Text style={styles.statValue}>{logs.data?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Places logged</Text>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Your restaurant history starts with your first log.</Text>}
      renderSectionHeader={({ section }) => <Text style={styles.month}>{section.title.toUpperCase()}</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/log/[id]", params: { id: item.id } }} asChild>
          <Pressable style={styles.row}>
            <Text style={styles.day}>{parseVisitDate(item.visited_at)?.getDate() ?? ""}</Text>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{nameById.get(item.restaurant_id) ?? "Restaurant"}</Text>
              <View style={styles.meta}>
                <RatingStars value={Math.round(item.overall_rating)} size={12} />
                <Text style={styles.metaText}>{formatVisitDate(item.visited_at)}</Text>
              </View>
            </View>
          </Pressable>
        </Link>
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xl },
  statNavy: { backgroundColor: colors.navy },
  statYellow: { backgroundColor: colors.yellow },
  statValue: { fontSize: 30, fontWeight: "900", color: colors.navy },
  statLabel: text.caption,
  onNavy: { color: colors.white },
  month: { ...text.overline, color: colors.navy, marginTop: spacing.md, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  day: { width: 32, fontSize: 24, fontWeight: "900", color: colors.navy },
  rowBody: { flex: 1, gap: spacing.xs },
  name: text.bodyStrong,
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaText: text.caption,
  empty: { ...text.caption, textAlign: "center", padding: spacing.xl },
});
