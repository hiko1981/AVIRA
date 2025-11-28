import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { I18nextProvider } from "react-i18next";

import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { ConsentScreen } from "./src/screens/ConsentScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ScanScreen from "./src/screens/ScanScreen";
import MapScreen from "./src/screens/MapScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

import {
  AppInstallationProvider,
  useAppInstallation
} from "./src/context/AppInstallationContext";
import { RootStackParamList } from "./src/navigation-types";
import i18n from "./src/i18n";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { ready, isNewInstall, appId } = useAppInstallation();

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const initialRouteName = isNewInstall ? "Welcome" : "Dashboard";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Consent" component={ConsentScreen} />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ appId: appId ?? null } as any}
      />
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppInstallationProvider>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </I18nextProvider>
    </AppInstallationProvider>
  );
}
