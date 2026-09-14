import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface RankSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function RankSelect({ options, value, onChange, max = 5 }: RankSelectProps) {
  const available = options.filter((o) => !value.includes(o));
  const add = (opt: string) => value.length < max && onChange([...value, opt]);
  const remove = (opt: string) => onChange(value.filter((v) => v !== opt));

  return (
    <View style={styles.wrap}>
      <Text style={styles.overline}>Your top {max}</Text>
      {value.length === 0 ? (
        <Text style={styles.empty}>Tap options below to rank them in order.</Text>
      ) : (
        value.map((opt, i) => (
          <Pressable key={opt} onPress={() => remove(opt)} style={styles.ranked}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.rankedLabel}>{opt}</Text>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        ))
      )}
      <Text style={[styles.overline, styles.optionsTitle]}>Options</Text>
      <View style={styles.chips}>
        {available.map((opt) => (
          <Pressable key={opt} onPress={() => add(opt)} disabled={value.length >= max} style={[styles.chip, value.length >= max && styles.chipDisabled]}>
            <Text style={styles.chipLabel}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  overline: text.overline,
  optionsTitle: { marginTop: spacing.md },
  empty: { ...text.caption, textAlign: "center", padding: spacing.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg },
  ranked: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.navy, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  badge: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  badgeText: { ...text.bodyStrong, color: colors.navy },
  rankedLabel: { ...text.bodyStrong, color: colors.white, flex: 1 },
  remove: { ...text.caption, color: colors.white },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  chipDisabled: { opacity: 0.4 },
  chipLabel: text.bodyStrong,
});
