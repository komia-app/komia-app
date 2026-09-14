import { NativeTabs } from "expo-router/unstable-native-tabs";

import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.yellow}
      backgroundColor={colors.navy}
      iconColor={{ default: colors.white, selected: colors.yellow }}
      labelStyle={{ default: { color: colors.white }, selected: { color: colors.yellow } }}
      indicatorColor={colors.navyDeep}
    >
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(lists)">
        <NativeTabs.Trigger.Icon sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }} md="checklist" />
        <NativeTabs.Trigger.Label>My logs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
