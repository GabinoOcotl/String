import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import { ScheduleLoadingCenter } from "@/components/schedule/ScheduleLoadingCenter";
import { themeColors } from "@/constants/theme";
import { useSchedule } from "@/contexts/ScheduleContext";
import { todayWeekday, weekdayName } from "@/lib/schedule/meetingDays";
import {
  buildRouteStops,
  markerDescription,
  markerTitle,
  stopListLabel,
  UW_CAMPUS_REGION,
  type RouteStop,
} from "@/lib/schedule/routeStops";
import { useScheduleForDay } from "@/lib/schedule/useScheduleForDay";

function regionForStops(stops: RouteStop[]): Region {
  if (stops.length === 0) {
    return { ...UW_CAMPUS_REGION };
  }

  if (stops.length === 1) {
    return {
      latitude: stops[0].latitude,
      longitude: stops[0].longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };
  }

  let minLat = stops[0].latitude;
  let maxLat = stops[0].latitude;
  let minLng = stops[0].longitude;
  let maxLng = stops[0].longitude;

  for (const stop of stops) {
    minLat = Math.min(minLat, stop.latitude);
    maxLat = Math.max(maxLat, stop.latitude);
    minLng = Math.min(minLng, stop.longitude);
    maxLng = Math.max(maxLng, stop.longitude);
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.4, 0.01);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export default function RouteMapScreen() {
  const colorScheme = useColorScheme();
  const colors = themeColors[colorScheme === "dark" ? "dark" : "light"];
  const { loading } = useSchedule();
  const { classes, weekday } = useScheduleForDay();
  const mapRef = useRef<MapView>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);

  const { stops, missingCoordCount } = useMemo(
    () => buildRouteStops(classes),
    [classes],
  );

  const realToday = todayWeekday();
  const isSchoolToday = realToday >= 1 && realToday <= 5;
  const dayLabel =
    isSchoolToday && weekday === realToday
      ? "Today's walking order"
      : `${weekdayName(weekday)}'s walking order`;
  const emptyLabel = `No classes on ${weekdayName(weekday)}`;
  const mapsNative = Platform.OS === "ios" || Platform.OS === "android";

  const polylineCoords = useMemo(
    () =>
      stops.map((stop) => ({
        latitude: stop.latitude,
        longitude: stop.longitude,
      })),
    [stops],
  );

  const fitMap = useCallback(() => {
    if (!mapsNative || stops.length === 0) {
      return;
    }
    if (stops.length === 1) {
      mapRef.current?.animateToRegion(regionForStops(stops), 350);
      return;
    }
    mapRef.current?.fitToCoordinates(polylineCoords, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [mapsNative, polylineCoords, stops]);

  useEffect(() => {
    fitMap();
  }, [fitMap]);

  useEffect(() => {
    if (!mapsNative) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!cancelled) {
        setShowUserLocation(status === "granted");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapsNative]);

  if (loading && classes.length === 0) {
    return <ScheduleLoadingCenter />;
  }

  const hasClasses = classes.length > 0;
  const hasStops = stops.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Route planner</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {dayLabel}
        </Text>
        {hasClasses && missingCoordCount > 0 ? (
          <Text
            style={[styles.banner, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {missingCoordCount === 1
              ? "1 location missing a map pin"
              : `${missingCoordCount} locations missing map pins`}
          </Text>
        ) : null}
        {!hasClasses ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {emptyLabel}
          </Text>
        ) : null}
        {hasClasses && !hasStops ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No map pins for {weekdayName(weekday)} — class locations need
            coordinates.
          </Text>
        ) : null}
      </View>

      {mapsNative ? (
        <View
          style={[
            styles.mapShell,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={regionForStops(stops)}
            showsUserLocation={showUserLocation}
            showsMyLocationButton={showUserLocation}
            onMapReady={fitMap}
          >
            {stops.map((stop, index) => (
              <Marker
                key={stop.key}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                title={markerTitle(stop, index)}
                description={markerDescription(stop)}
              />
            ))}
            {polylineCoords.length >= 2 ? (
              <Polyline
                coordinates={polylineCoords}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            ) : null}
          </MapView>
        </View>
      ) : (
        <View
          style={[
            styles.webFallback,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.webFallbackText, { color: colors.textMuted }]}>
            Map view is available on iOS and Android. Stops for the day are
            listed below.
          </Text>
        </View>
      )}

      <FlatList
        data={stops}
        keyExtractor={(item) => item.key}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          hasStops ? (
            <Text style={[styles.listHeading, { color: colors.text }]}>
              Stops
            </Text>
          ) : null
        }
        ListEmptyComponent={
          hasClasses ? null : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Add classes on the Today tab to plan a walking route.
            </Text>
          )
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.stopCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.stopLabel, { color: colors.text }]}>
              {stopListLabel(item, index)}
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  banner: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  mapShell: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webFallback: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  webFallbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  listHeading: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
  },
  stopCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  stopLabel: {
    fontSize: 15,
    lineHeight: 22,
  },
  separator: {
    height: 10,
  },
});
