import { Stack } from "expo-router";

import { useSession } from "@/features/auth/session-provider";
import { colors } from "@/theme";

export default function AuthLayout() {
  const { state } = useSession();
  const notRegistered = state.status === "signed-out" && state.error === "user_not_registered";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Protected guard={notRegistered}>
        <Stack.Screen name="not-registered" />
      </Stack.Protected>
      <Stack.Protected guard={!notRegistered}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}
