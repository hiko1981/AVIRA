import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { ConsentScreen } from "./src/screens/ConsentScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import ScanScreen from "./src/screens/ScanScreen";
import MapScreen from "./src/screens/MapScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

import { AppInstallationProvider } from "./src/context/AppInstallationContext";
import { RootStackParamList } from "./src/navigation-types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AppInstallationProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Consent" component={ConsentScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppInstallationProvider>
  );
}
