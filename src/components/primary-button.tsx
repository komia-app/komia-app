import { Button, Host } from "@expo/ui";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";

interface PrimaryButtonProps {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "filled" | "outlined";
}

export function PrimaryButton({ children, onPress, disabled, loading, variant = "filled" }: PrimaryButtonProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }
  return (
    <Host matchContents>
      <Button
        variant={variant}
        onPress={onPress}
        disabled={disabled}
        style={variant === "filled" ? styles.filled : styles.outlined}
        label={children}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  filled: { backgroundColor: colors.yellow, borderRadius: radius.lg, height: 48 },
  outlined: { borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, height: 48 },
  loading: { height: 48, alignItems: "center", justifyContent: "center" },
});
