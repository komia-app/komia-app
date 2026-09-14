import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface ChipSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function ChipSelect({ options, value, onChange, max }: ChipSelectProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) return onChange(value.filter((v) => v !== opt));
    if (max && value.length >= max) return;
    onChange([...value, opt]);
  };
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <Pressable key={opt} onPress={() => toggle(opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={styles.label}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  chipActive: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  label: text.bodyStrong,
});
