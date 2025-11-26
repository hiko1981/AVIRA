import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation-types";
import { AviraBackground } from "../components/AviraBackground";
import { PrimaryButton } from "../components/PrimaryButton";
import colors from "../theme/colors";
import { supabase } from "../services/api/supabaseClient";
import childPin from "../../assets/pin_pasteldyb_smooth.png";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

type LatLng = {
  lat: number;
  lng: number;
};

export function MapScreen({ route, navigation }: Props) {
  const appId = route.params?.appId ?? null;
  const wristbandId = route.params?.wristbandId ?? null;

  const [childLocation, setChildLocation] = useState<LatLng | null>(null);
  const [childName, setChildName] = useState<string | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (!wristbandId) {
          throw new Error("Mangler armbånds-id");
        }

        const childPromise = supabase.rpc("dev_get_wristband_coords", {
          p_id: wristbandId,
          p_token_text: null,
        });

        const devicePromise = appId
          ? supabase.rpc("device_locations_24h", { p_app_id: appId })
          : Promise.resolve({ data: null, error: null });

        const [childResult, deviceResult] = await Promise.all([childPromise, devicePromise]);

        if (childResult.error) {
          throw childResult.error;
        }

        const childData = Array.isArray(childResult.data)
          ? childResult.data[0]
          : childResult.data;

        if (childData && childData.activated_lat != null && childData.activated_lng != null) {
          if (!isMounted) return;
          setChildLocation({
            lat: Number(childData.activated_lat),
            lng: Number(childData.activated_lng),
          });
          if (childData.child_name) {
            setChildName(childData.child_name as string);
          }
        }

        if (deviceResult && !deviceResult.error && Array.isArray(deviceResult.data)) {
          const latest = deviceResult.data[0];
          if (latest && latest.lat != null && latest.lng != null) {
            if (!isMounted) return;
            setDeviceLocation({
              lat: Number(latest.lat),
              lng: Number(latest.lng),
            });
          }
        }

        if (!childData || childData.activated_lat == null || childData.activated_lng == null) {
          if (!isMounted) return;
          setError("Ingen lokation fundet for armbåndet endnu.");
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message ?? "Kunne ikke hente lokation.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [appId, wristbandId]);

  const hasAnyLocation = !!childLocation || !!deviceLocation;

  const handleOpenDirections = () => {
    if (!childLocation) return;

    if (Platform.OS === "ios") {
      const url = `http://maps.apple.com/?daddr=${childLocation.lat},${childLocation.lng}`;
      Linking.openURL(url);
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${childLocation.lat},${childLocation.lng}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <AviraBackground>
        <View style={styles.screen}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Henter lokation...</Text>
          </View>
        </View>
      </AviraBackground>
    );
  }

  if (!hasAnyLocation) {
    return (
      <AviraBackground>
        <View style={styles.screen}>
          <View style={styles.center}>
            <Text style={styles.errorText}>{error || "Ingen lokation tilgængelig."}</Text>
          </View>
        </View>
      </AviraBackground>
    );
  }

  const baseLat = (childLocation ?? deviceLocation)!.lat;
  const baseLng = (childLocation ?? deviceLocation)!.lng;

  let centerLat = baseLat;
  let centerLng = baseLng;
  let latitudeDelta = 0.01;
  let longitudeDelta = 0.01;

  if (childLocation && deviceLocation) {
    const minLat = Math.min(childLocation.lat, deviceLocation.lat);
    const maxLat = Math.max(childLocation.lat, deviceLocation.lat);
    const minLng = Math.min(childLocation.lng, deviceLocation.lng);
    const maxLng = Math.max(childLocation.lng, deviceLocation.lng);

    centerLat = (minLat + maxLat) / 2;
    centerLng = (minLng + maxLng) / 2;

    const latSpan = Math.max(maxLat - minLat, 0.01) * 1.6;
    const lngSpan = Math.max(maxLng - minLng, 0.01) * 1.6;

    latitudeDelta = Math.min(Math.max(latSpan, 0.01), 2);
    longitudeDelta = Math.min(Math.max(lngSpan, 0.01), 2);
  }

  return (
    <AviraBackground>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backLabel}>Tilbage</Text>
          </TouchableOpacity>

          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Lokation</Text>
            <Text style={styles.subtitle}>Barnets lokation</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: centerLat,
              longitude: centerLng,
              latitudeDelta,
              longitudeDelta,
            }}
          >
            {deviceLocation && (
              <Marker
                coordinate={{
                  latitude: deviceLocation.lat,
                  longitude: deviceLocation.lng,
                }}
                title="Her står du"
              />
            )}

            {childLocation && (
              <Marker
                coordinate={{
                  latitude: childLocation.lat,
                  longitude: childLocation.lng,
                }}
              >
                <View style={styles.childMarkerContainer}>
                  {childName && (
                    <View style={styles.childNameBubble}>
                      <Text style={styles.childNameText}>{childName}</Text>
                    </View>
                  )}
                  <View style={styles.childPinWrapper}>
                    <Image source={childPin} style={styles.childPinImage} resizeMode="contain" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>
        </View>

        {childLocation && (
          <View style={styles.ctaWrapper}>
            <PrimaryButton label="Åbn rute i kort" onPress={handleOpenDirections} />
          </View>
        )}
      </View>
    </AviraBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
    marginRight: 8,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mapWrapper: {
    marginTop: 16,
    height: "52%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error || "#ff5555",
    textAlign: "center",
  },
  childMarkerContainer: {
    alignItems: "center",
  },
  childNameBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.65)",
    marginBottom: 4,
  },
  childNameText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  childPinWrapper: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  childPinImage: {
    width: "100%",
    height: "100%",
  },
  ctaWrapper: {
    marginTop: 24,
  },
});

export default MapScreen;
