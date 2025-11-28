import React, { useCallback, useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { PrimaryButton } from "./PrimaryButton";
import colors from "../theme/colors";
import { useAppInstallation } from "../context/AppInstallationContext";

type Props = {
  appId?: string | null;
  onFocus?: () => void;
};

const STRINGS = {
  title: "Support",
  description: "Skriv til os, hvis du har brug for hjælp til armbånd eller app.",
  subjectLabel: "Emne (valgfrit)",
  subjectPlaceholder: "Kort overskrift",
  messageLabel: "Besked",
  messagePlaceholder: "Beskriv dit spørgsmål eller din udfordring",
  send: "Send besked",
  sent: "Din besked er sendt. Vi vender tilbage hurtigst muligt.",
  errorGeneric: "Noget gik galt. Prøv igen om lidt.",
  missingAppId: "Kunne ikke finde app-id. Prøv at genstarte appen.",
};

export function SupportForm({ appId: propAppId, onFocus }: Props) {
  const { appId: ctxAppId, deviceInfo } = useAppInstallation();
  const appId = propAppId ?? ctxAppId ?? null;

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kun besked er påkrævet
  const canSend = !busy && !!appId && message.trim().length > 0;

  const handleSubjectChange = useCallback((value: string) => {
    setSubject(value);
    setSent(false);
    setError(null);
  }, []);

  const handleMessageChange = useCallback((value: string) => {
    setMessage(value);
    setSent(false);
    setError(null);
  }, []);

  const handleMessageFocus = useCallback(() => {
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    if (!appId) {
      setError(STRINGS.missingAppId);
      return;
    }

    setBusy(true);
    setError(null);

    let coords:
      | { latitude: number; longitude: number; accuracy?: number | null }
      | null = null;

    try {
      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;
      if (status !== "granted") {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        };
      }
    } catch {
      coords = null;
    }

    const hasGps = !!coords;
    const geo = coords
      ? {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy ?? null,
        }
      : {};

    const locale =
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : "unknown";

    const extra = {
      subject: subject.trim() || null,
      locale,
      source: "avira-app-settings",
      platform: Platform.OS,
    };

    const payload = {
      app_id: appId,
      platform: Platform.OS,
      subject: subject.trim() || null,
      message: message.trim(),
      has_gps: hasGps,
      lat: coords?.latitude ?? null,
      lng: coords?.longitude ?? null,
      accuracy: coords?.accuracy ?? null,
      device_id: deviceInfo?.deviceId ?? appId,
      geo,
      extra,
    };

    try {
      const { error: insertError } = await supabase
        .from("support_messages")
        .insert([payload]);

      if (insertError) {
        console.log("support_messages insert error:", insertError);
        setError(insertError.message || STRINGS.errorGeneric);
        setBusy(false);
        return;
      }

      setSubject("");
      setMessage("");
      setSent(true);
      setBusy(false);
    } catch (e: any) {
      console.log("support_messages insert exception:", e);
      setError(STRINGS.errorGeneric);
      setBusy(false);
    }
  }, [appId, canSend, deviceInfo, message, subject]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{STRINGS.title}</Text>
      <Text style={styles.description}>{STRINGS.description}</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{STRINGS.subjectLabel}</Text>
        <TextInput
          value={subject}
          onChangeText={handleSubjectChange}
          placeholder={STRINGS.subjectPlaceholder}
          placeholderTextColor="rgba(248,250,252,0.4)"
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{STRINGS.messageLabel}</Text>
        <TextInput
          value={message}
          onChangeText={handleMessageChange}
          placeholder={STRINGS.messagePlaceholder}
          placeholderTextColor="rgba(248,250,252,0.4)"
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onFocus={handleMessageFocus}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {sent && !error && <Text style={styles.sent}>{STRINGS.sent}</Text>}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={busy ? "..." : STRINGS.send}
          onPress={handleSend}
          style={[
            styles.primaryButton,
            !canSend && styles.primaryButtonDisabled,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: "rgba(15,23,42,0.8)",
  },
  textArea: {
    minHeight: 96,
  },
  error: {
    color: "#F97373",
    fontSize: 13,
    marginBottom: 8,
  },
  sent: {
    color: "#4ADE80",
    fontSize: 13,
    marginBottom: 8,
  },
  buttonRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  primaryButton: {
    width: "100%",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
});
