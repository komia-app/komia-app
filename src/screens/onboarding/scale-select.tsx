import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface ScaleOption<T> {
  value: T;
  label: string;
  sublabel?: string;
}

interface ScaleSelectProps<T extends string | number> {
  options: ScaleOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
}

export function ScaleSelect<T extends string | number>({ options, value, onChange }: ScaleSelectProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={String(opt.value)} onPress={() => onChange(opt.value)} style={[styles.row, active && styles.rowActive]}>
            <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.dot} /> : null}</View>
            <View style={styles.labels}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  rowActive: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  radio: { width: 24, height: 24, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.navy },
  labels: { flex: 1, gap: 2 },
  label: text.bodyStrong,
  sublabel: text.caption,
});
