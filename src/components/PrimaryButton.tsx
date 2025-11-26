import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.ctaStart, colors.ctaMiddle, colors.ctaEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  gradient: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  label: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
});
