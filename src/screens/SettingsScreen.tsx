import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation-types";
import { AviraBackground } from "../components/AviraBackground";
import { SupportForm } from "../components/SupportForm";
import colors from "../theme/colors";

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
};

export function SettingsScreen({ navigation, route }: Props) {
  const [systemEnabled, setSystemEnabled] = useState(true);
  const [wristbandDefaultEnabled, setWristbandDefaultEnabled] = useState(true);

  const scrollRef = useRef<ScrollView | null>(null);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleSystem = useCallback((value: boolean) => {
    setSystemEnabled(value);
  }, []);

  const handleToggleWristbandsDefault = useCallback((value: boolean) => {
    setWristbandDefaultEnabled(value);
  }, []);

  const appId = route.params?.appId;

  const handleSupportFocus = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  return (
    <AviraBackground>
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
              />
            </View>
          </View>

          <SupportForm appId={appId} onFocus={handleSupportFocus} />
        </ScrollView>
      </View>
    </AviraBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSpacer: {
    width: 64,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 320,
  },
  sectionCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 18,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  rowTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rowDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  separator: {
    height: 1,
    marginVertical: 8,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
});

export default SettingsScreen;

