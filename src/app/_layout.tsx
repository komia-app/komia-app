import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";

import { ScreenLoader } from "@/components/screen-loader";
import { SessionProvider, useSession } from "@/features/auth/session-provider";
import { queryClient } from "@/lib/query-client";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();

// The Base44 SDK logs every failed request in development; the screens already
// show those errors, so keep them out of the LogBox overlay. Metro still prints them.
if (__DEV__) {
  LogBox.ignoreLogs([/^\[Base44 SDK Error\]/, /^Error data:/]);
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { state } = useSession();
  const loading = state.status === "loading";

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return <ScreenLoader />;

  const signedIn = state.status === "signed-in";
  const onboarded = signedIn && state.user.onboarding_completed === true;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="mia"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [1],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="log-visit"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.7, 1],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true, headerShown: false }}
        />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
