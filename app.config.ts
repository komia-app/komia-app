import type { ConfigContext, ExpoConfig } from "expo/config";

const locationReason = "KOMIA shows restaurants near you on the map.";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "KOMIA",
  slug: "komia",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "komia",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  ios: {
    bundleIdentifier: "co.komia.app",
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: locationReason,
    },
  },
  android: {
    package: "co.komia.app",
    adaptiveIcon: {
      backgroundColor: "#10375C",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    ["expo-location", { locationWhenInUsePermission: locationReason }],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#10375C",
        image: "./assets/images/splash-icon.png",
        imageWidth: 120,
      },
    ],
    [
      "react-native-maps",
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? "" },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
