import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Camera } from "expo-camera";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../navigation-types";
import { useAppInstallation } from "../context/AppInstallationContext";
import { supabase } from "../lib/supabase";
import { PrimaryButton } from "../components/PrimaryButton";
import { AviraBackground } from "../components/AviraBackground";
import colors from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Consent">;
type PermissionState = "unknown" | "granted" | "denied";

export function ConsentScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { appId, deviceInfo, ready } = useAppInstallation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!ready || !appId || !deviceInfo || busy) return;
    setBusy(true);
    setError(null);

    let locationStatus: PermissionState = "unknown";
    let cameraStatus: PermissionState = "unknown";
    let pushStatus: PermissionState = "unknown";
    let coords: { latitude: number; longitude: number; accuracy?: number } | null = null;
    let pushToken: string | null = null;

    try {
      const locExisting = await Location.getForegroundPermissionsAsync();
      if (locExisting.status === "granted") locationStatus = "granted";
      else {
        const locReq = await Location.requestForegroundPermissionsAsync();
        locationStatus = locReq.status === "granted" ? "granted" : "denied";
      }
      if (locationStatus === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined
        };
      }
    } catch {
      locationStatus = "denied";
    }

    try {
      const camExisting = await Camera.getCameraPermissionsAsync();
      if (camExisting.status === "granted") cameraStatus = "granted";
      else {
        const camReq = await Camera.requestCameraPermissionsAsync();
        cameraStatus = camReq.status === "granted" ? "granted" : "denied";
      }
    } catch {
      cameraStatus = "denied";
    }

    try {
      const notifExisting = await Notifications.getPermissionsAsync();
      if (notifExisting.status === "granted") pushStatus = "granted";
      else {
        const notifReq = await Notifications.requestPermissionsAsync();
        pushStatus = notifReq.status === "granted" ? "granted" : "denied";
      }
      if (pushStatus === "granted") {
        const tokenResponse = await Notifications.getExpoPushTokenAsync();
        pushToken = tokenResponse.data ?? null;
      }
    } catch {
      pushStatus = "denied";
    }

    const fpRaw = [
      Device.osInternalBuildId ?? "",
      Device.modelId ?? "",
      Device.deviceName ?? "",
      Device.osVersion ?? "",
      Application.applicationId ?? "",
      Platform.OS,
      Date.now()
    ].join("|");

    const attested = {
      is_emulator: deviceInfo.isEmulator,
      permissions: { location: locationStatus, camera: cameraStatus, push: pushStatus }
    };

    try {
      const { data, error: regError } = await supabase.rpc("register_device_v7", {
        p_app_id: appId,
        p_push_token: pushToken,
        p_platform: deviceInfo.platform,
        p_model: deviceInfo.model,
        p_os_version: deviceInfo.osVersion,
        p_bundle_id: deviceInfo.bundleId,
        p_app_version: deviceInfo.appVersion,
        p_build_number: deviceInfo.buildNumber,
        p_attested: attested,
        p_fp_raw: fpRaw,
        p_vendor: "apple"
      });

      console.log("register_device_v7 response:", data, regError);

      if (regError) {
        setError(regError.message);
        setBusy(false);
        return;
      }

      if (coords) {
        await supabase.rpc("log_device_location", {
          p_app_id: appId,
          p_lat: coords.latitude,
          p_lng: coords.longitude,
          p_accuracy: coords.accuracy ?? 0
        });
      }

      setBusy(false);
      navigation.replace("Dashboard", { appId });
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? t("consent.unknownError"));
    }
  }

  return (
    <AviraBackground overlayOpacity={0.25}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("consent.title")}</Text>

        <Text style={styles.subtitle}>{t("consent.subtitle")}</Text>

        <View style={styles.card}>
          <Text style={styles.itemTitle}>{t("consent.locationTitle")}</Text>
          <Text style={styles.itemBody}>{t("consent.locationBody")}</Text>

          <Text style={styles.itemTitle}>{t("consent.cameraTitle")}</Text>
          <Text style={styles.itemBody}>{t("consent.cameraBody")}</Text>

          <Text style={styles.itemTitle}>{t("consent.pushTitle")}</Text>
          <Text style={styles.itemBody}>{t("consent.pushBody")}</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {busy && <ActivityIndicator style={styles.spinner} />}
          <PrimaryButton label={t("consent.cta")} onPress={handleContinue} />
        </View>
      </ScrollView>
    </AviraBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 30
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: "rgba(15,23,42,0.65)",
    marginBottom: 30
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 15
  },
  itemBody: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6
  },
  footer: {
    marginTop: 20
  },
  spinner: {
    marginBottom: 16
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.25)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16
  },
  errorText: {
    color: "#fecaca",
    textAlign: "center"
  }
});
