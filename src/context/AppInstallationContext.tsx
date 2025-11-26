import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Application from "expo-application";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

type DeviceInfo = {
  platform: string;
  model: string;
  osVersion: string;
  bundleId: string;
  appVersion: string;
  buildNumber: string;
  isEmulator: boolean;
};

type AppInstallationContextValue = {
  ready: boolean;
  appId: string | null;
  isNewInstall: boolean;
  deviceInfo: DeviceInfo | null;
};

const AppInstallationContext = createContext<AppInstallationContextValue>({
  ready: false,
  appId: null,
  isNewInstall: false,
  deviceInfo: null,
});

const APP_ID_KEY = "avira.app_id";

async function getOrCreateAppId() {
  const existing = await SecureStore.getItemAsync(APP_ID_KEY);
  if (existing) return { appId: existing, isNew: false };
  const id = uuidv4();
  await SecureStore.setItemAsync(APP_ID_KEY, id);
  return { appId: id, isNew: true };
}

function buildDeviceInfo(): DeviceInfo {
  return {
    platform: Platform.OS,
    model: Device.modelName ?? "unknown",
    osVersion: Device.osVersion ?? "unknown",
    bundleId: Application.applicationId ?? "unknown",
    appVersion: Application.nativeApplicationVersion ?? "unknown",
    buildNumber: Application.nativeBuildVersion ?? "unknown",
    isEmulator: Device.isDevice === false,
  };
}

export function AppInstallationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppInstallationContextValue>({
    ready: false,
    appId: null,
    isNewInstall: false,
    deviceInfo: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { appId, isNew } = await getOrCreateAppId();
        const deviceInfo = buildDeviceInfo();
        if (cancelled) return;
        setState({
          ready: true,
          appId,
          isNewInstall: isNew,
          deviceInfo,
        });
      } catch {
        if (cancelled) return;
        setState({
          ready: true,
          appId: null,
          isNewInstall: false,
          deviceInfo: null,
        });
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppInstallationContext.Provider value={state}>
      {children}
    </AppInstallationContext.Provider>
  );
}

export function useAppInstallation() {
  return useContext(AppInstallationContext);
}
