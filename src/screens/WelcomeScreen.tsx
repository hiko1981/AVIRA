import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../navigation-types";
import colors from "../theme/colors";
import { PrimaryButton } from "../components/PrimaryButton";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  function handleGetStarted() {
    navigation.navigate("Consent");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <ImageBackground
        source={require("../../assets/background.png")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <View style={styles.watermarkContainer}>
            <Image
              source={require("../../assets/watermark.png")}
              style={styles.watermark}
              resizeMode="contain"
            />
          </View>

          <View style={styles.container}>
            <Text style={styles.appName}>{t("welcome.appName")}</Text>
            <Text style={styles.tagline}>{t("welcome.tagline")}</Text>

            <Text style={styles.heroTitle}>{t("welcome.heroTitle")}</Text>

            <Text style={styles.heroSubtitle}>{t("welcome.heroSubtitle")}</Text>

            <View style={styles.chips}>
              <LinearGradient
                colors={["#A0C4FF", "#FFD6FF"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{t("welcome.chip1")}</Text>
              </LinearGradient>

              <LinearGradient
                colors={["#BDE0FE", "#FFC8DD"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{t("welcome.chip2")}</Text>
              </LinearGradient>

              <LinearGradient
                colors={["#C1D5FF", "#E9B3FF"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{t("welcome.chip3")}</Text>
              </LinearGradient>
            </View>

            <PrimaryButton
              label={t("welcome.getStarted")}
              onPress={handleGetStarted}
              style={{ width: "100%", marginTop: 50 }}
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#020617" },
  background: { flex: 1 },
  backgroundImage: { resizeMode: "cover" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.05)"
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.select({ ios: 60, android: 40 }) as number,
    alignItems: "center"
  },
  appName: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 4,
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12
  },
  tagline: {
    marginTop: 6,
    fontSize: 18,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12
  },
  heroTitle: {
    marginTop: 40,
    fontSize: 36,
    lineHeight: 44,
    textAlign: "center",
    fontWeight: "800",
    color: colors.textPrimary,
    textShadowColor: "rgba(15,23,42,0.95)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10
  },
  heroSubtitle: {
    marginTop: 22,
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    color: colors.textSecondary,
    textShadowColor: "rgba(15,23,42,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    paddingHorizontal: 20
  },
  chips: {
    marginTop: 40,
    gap: 16,
    alignItems: "center"
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)"
  },
  chipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary
  },
  watermarkContainer: {
    position: "absolute",
    top: "18%",
    left: "50%",
    transform: [{ translateX: -290 }]
  },
  watermark: {
    width: 580,
    height: 580,
    opacity: 0.22
  }
});
