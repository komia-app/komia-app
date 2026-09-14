import * as Location from "expo-location";
import { Stack, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { type MapPressEvent, Marker, type Region } from "react-native-maps";

import { ScreenLoader } from "@/components/screen-loader";
import { useRestaurants } from "@/features/restaurants/queries";
import { colors } from "@/theme";
import type { Restaurant } from "@/types/entities";

import { matchesQuery } from "@/features/restaurants/filter";
import { useRestaurantActions } from "@/features/restaurants/use-restaurant-actions";

import { RestaurantSheet } from "./restaurant-sheet";

const BOGOTA: Region = { latitude: 4.6517, longitude: -74.0627, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export function MapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const restaurants = useRestaurants();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const { onSave, onLog } = useRestaurantActions(() => setSelected(null));

  useEffect(() => {
    let cancelled = false;
    async function locate() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted" || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({});
        if (cancelled) return;
        mapRef.current?.animateToRegion(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
          600,
        );
      } catch {
        // Location is optional: the map stays on the Bogota region.
      }
    }
    void locate();
    return () => {
      cancelled = true;
    };
  }, []);

  // The sheet is a native modal, so it would otherwise stay open over a pushed screen.
  useEffect(() => navigation.addListener("blur", () => setSelected(null)), [navigation]);

  const visible = useMemo(
    () => (restaurants.data ?? []).filter((r) => r.latitude && r.longitude && matchesQuery(r, query)),
    [restaurants.data, query],
  );

  // Android also fires the map press for a marker tap; only a plain map tap clears the sheet.
  const onMapPress = (e: MapPressEvent) => {
    if (e.nativeEvent.action !== "marker-press") setSelected(null);
  };

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerTransparent: true, headerLargeTitleEnabled: false, title: "" }} />
      <Stack.SearchBar placeholder="Search restaurants" onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling={false} />
      <MapView ref={mapRef} style={styles.map} initialRegion={BOGOTA} showsUserLocation onPress={onMapPress}>
        {visible.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude as number, longitude: r.longitude as number }}
            pinColor={colors.yellow}
            onPress={() => setSelected(r)}
          />
        ))}
      </MapView>
      <RestaurantSheet restaurant={selected} onDismiss={() => setSelected(null)} onSave={onSave} onLog={onLog} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
});
