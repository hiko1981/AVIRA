import React from "react";
import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  overlayOpacity?: number; 
};

export function AviraBackground({ children, overlayOpacity = 0.05 }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <ImageBackground
        source={require("../../assets/background.png")}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View
          style={[
            styles.overlay,
            { backgroundColor: `rgba(2,6,23,${overlayOpacity})` },
          ]}
        >
          <View style={styles.watermarkContainer}>
            <Image
              source={require("../../assets/watermark.png")}
              style={styles.watermark}
              resizeMode="contain"
            />
          </View>

          <View style={styles.content}>{children}</View>
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
  },
  watermarkContainer: {
    position: "absolute",
    top: "18%",
    left: "50%",
    transform: [{ translateX: -290 }],
  },
  watermark: {
    width: 580,
    height: 580,
    opacity: 0.22,
  },
  content: {
    flex: 1,
  },
});
