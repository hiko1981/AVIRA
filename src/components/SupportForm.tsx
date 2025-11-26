import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import colors from "../theme/colors";
import { supabase } from "../services/api/supabaseClient";

type Props = {
  appId?: string;
  onClose?: () => void;
  onFocus?: () => void;
};

export function SupportForm({ appId, onClose, onFocus }: Props) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const [locationError, setLocationError] = useState("");

  const canSend = !!appId && message.trim().length > 0 && !submitting;

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    setSubmitting(true);
    setStatus("idle");
    setErrorText("");
    setLocationError("");

    try {
      const { status: permissionStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== "granted") {
        setLocationError("Lokation er påkrævet for at kunne sende beskeden.");
        setSubmitting(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ?? null;

      const payload: any = {
        app_id: appId,
        platform: Platform.OS,
        subject: subject.trim() || null,
        message: message.trim(),
        has_gps: true,
        lat,
        lng,
        accuracy,
        geo: {
          type: "Point",
          coordinates: [lng, lat],
          accuracy,
        },
      };

      const { error } = await supabase.from("support_messages").insert([
        payload,
      ]);

      if (error) {
        setStatus("error");
        setErrorText("Kunne ikke sende beskeden. Prøv igen.");
      } else {
        setStatus("success");
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      setStatus("error");
      setErrorText("Kunne ikke sende beskeden. Prøv igen.");
    }

    setSubmitting(false);
  }, [appId, subject, message, canSend]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Support</Text>
      <Text style={styles.cardDescription}>
        Skriv til Avira support. Beskeden sendes direkte fra denne installation.
      </Text>

      {!appId && (
        <Text style={styles.warningText}>
          App-id mangler. Gå tilbage og åbn indstillinger via forsiden, så
          app-id følger med.
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Emne (valgfrit)"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={subject}
        onChangeText={setSubject}
        autoCapitalize="sentences"
        editable={!submitting}
        onFocus={onFocus}
      />

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Din besked til support (påkrævet)"
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={message}
        onChangeText={setMessage}
        autoCapitalize="sentences"
        multiline
        textAlignVertical="top"
        editable={!submitting}
        onFocus={onFocus}
      />

      {locationError.length > 0 && (
        <Text style={styles.locationErrorText}>{locationError}</Text>
      )}

      {status === "success" && (
        <Text style={styles.successText}>Beskeden er sendt.</Text>
      )}
      {status === "error" && (
        <Text style={styles.errorText}>{errorText}</Text>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClose}
          disabled={submitting}
        >
          <Text style={styles.secondaryButtonLabel}>Luk</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canSend && styles.primaryButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {submitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryButtonLabel}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  warningText: {
    fontSize: 13,
    color: "#ffdd88",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: colors.textPrimary,
    backgroundColor: "rgba(0,0,0,0.35)",
    fontSize: 14,
  },
  messageInput: {
    minHeight: 100,
  },
  locationErrorText: {
    fontSize: 12,
    color: "#ff9a9a",
    marginBottom: 8,
  },
  successText: {
    fontSize: 13,
    color: "#7dff9a",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#ff9a9a",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    marginRight: 8,
  },
  secondaryButtonLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accentPrimary ?? "#ffffff",
  },
  primaryButtonDisabled: {
    opacity: 0.35,
  },
  primaryButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
});

