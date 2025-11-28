import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation-types";
import { AviraBackground } from "../components/AviraBackground";
import { SupportForm } from "../components/SupportForm";
import colors from "../theme/colors";
import { useAppInstallation } from "../context/AppInstallationContext";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const STRINGS = {
  title: "Indstillinger",
  back: "Tilbage",
  notificationsSectionTitle: "Notifikationer",
  notificationsSectionDescription:
    "Styr hvilke beskeder du får fra Avira og dine armbånd.",
  systemTitle: "Systembeskeder",
  systemDescription: "Support, systeminfo og vigtige driftsbeskeder.",
  wristbandDefaultTitle: "Armbåndsbeskeder (standard)",
  wristbandDefaultDescription:
    "Standard for nye armbånd. Kan overstyres på hvert armbånd.",
  pushDisabledNote:
    "Push-notifikationer er slået fra i iOS-indstillinger. Slå dem til for at ændre disse valg.",
};

export function SettingsScreen({ navigation, route }: Props) {
  const { appId: ctxAppId } = useAppInstallation();
  const routeAppId = route.params?.appId ?? null;
  const appId = routeAppId ?? ctxAppId ?? null;

  const [systemEnabled, setSystemEnabled] = useState(true);
  const [wristbandDefaultEnabled, setWristbandDefaultEnabled] = useState(true);
  const [pushAllowed, setPushAllowed] = useState<boolean | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPermission() {
      try {
        const perm = await Notifications.getPermissionsAsync();
        if (cancelled) return;
        const granted = perm.status === "granted";
        setPushAllowed(granted);
        if (!granted) {
          setSystemEnabled(false);
          setWristbandDefaultEnabled(false);
        }
      } catch {
        if (cancelled) return;
        setPushAllowed(null);
      }
    }

    loadPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleSystem = useCallback(
    (value: boolean) => {
      if (pushAllowed === false) return;
      setSystemEnabled(value);
    },
    [pushAllowed]
  );

  const handleToggleWristbandsDefault = useCallback(
    (value: boolean) => {
      if (pushAllowed === false) return;
      setWristbandDefaultEnabled(value);
    },
    [pushAllowed]
  );

  const handleSupportFocus = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollToEnd({ animated: true });
  }, []);

  const switchesDisabled = pushAllowed === false;

  return (
    <AviraBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.screen}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backLabel}>{STRINGS.back}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{STRINGS.title}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {STRINGS.notificationsSectionTitle}
              </Text>
              <Text style={styles.sectionDescription}>
                {STRINGS.notificationsSectionDescription}
              </Text>

              <View style={styles.row}>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle}>{STRINGS.systemTitle}</Text>
                  <Text style={styles.rowDescription}>
                    {STRINGS.systemDescription}
                  </Text>
                </View>
                <Switch
                  value={systemEnabled}
                  onValueChange={handleToggleSystem}
                  disabled={switchesDisabled}
                />
              </View>

              <View style={styles.separator} />

              <View style={styles.row}>
                <View style={styles.rowTextBlock}>
                  <Text style={styles.rowTitle}>
                    {STRINGS.wristbandDefaultTitle}
                  </Text>
                  <Text style={styles.rowDescription}>
                    {STRINGS.wristbandDefaultDescription}
                  </Text>
                </View>
                <Switch
                  value={wristbandDefaultEnabled}
                  onValueChange={handleToggleWristbandsDefault}
                  disabled={switchesDisabled}
                />
              </View>

              {switchesDisabled && (
                <Text style={styles.pushDisabledNote}>
                  {STRINGS.pushDisabledNote}
                </Text>
              )}
            </View>

            <SupportForm appId={appId} onFocus={handleSupportFocus} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AviraBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 260,
  },
  sectionCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.35)",
    marginVertical: 10,
  },
  pushDisabledNote: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
