import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from "react-native";
import colors from "../theme/colors";
import pinIcon from "../../assets/pin_pasteldyb_smooth.png";

type WristbandCardProps = {
  id: string;
  name: string;
  expiresAt?: string | null;
  lastSeenAt?: string | null;
  pushEnabled?: boolean;
  onTogglePush: (next: boolean) => void;
  onOpenLocation: () => void;
  index?: number;
  isPinned?: boolean;
};

const STRINGS = {
  lastSeenLabel: "Sidst set",
  unknown: "Ukendt",
  expiresLabel: "Udløber om",
  expired: "Udløbet",
  notifications: "Notifikationer",
  openLocationPrefix: "Åbn",
  openLocationSuffix: "lokation",
};

function formatLastSeen(value?: string | null): string {
  if (!value) return STRINGS.unknown;
  const date = new Date(value);
  if (isNaN(date.getTime())) return STRINGS.unknown;
  return date.toLocaleString("da-DK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExpiresIn(value?: string | null): string {
  if (!value) return STRINGS.unknown;
  const expiry = new Date(value);
  if (isNaN(expiry.getTime())) return STRINGS.unknown;
  const diffMs = expiry.getTime() - Date.now();
  if (diffMs <= 0) return STRINGS.expired;
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} t ${minutes} min`;
}

export default function WristbandCard(props: WristbandCardProps) {
  const {
    name,
    expiresAt,
    lastSeenAt,
    pushEnabled,
    onTogglePush,
    onOpenLocation,
    isPinned,
  } = props;

  const [isSwitchOn, setIsSwitchOn] = useState<boolean>(!!pushEnabled);

  useEffect(() => {
    setIsSwitchOn(!!pushEnabled);
  }, [pushEnabled]);

  const lastSeenText = formatLastSeen(lastSeenAt);
  const expiresText = formatExpiresIn(expiresAt);
  const openLocationLabel = `${STRINGS.openLocationPrefix} ${name}s ${STRINGS.openLocationSuffix}`;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.nameText}>{name}</Text>
      </View>

      <View style={styles.infoBlock}>
        <Text style={styles.subText}>{STRINGS.lastSeenLabel}: {lastSeenText}</Text>
        <Text style={styles.subText}>{STRINGS.expiresLabel}: {expiresText}</Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.notificationsBlock}>
          <Switch
            value={isSwitchOn}
            onValueChange={(next) => {
              setIsSwitchOn(next);
              onTogglePush(next);
            }}
            trackColor={{ false: "rgba(255,255,255,0.2)", true: "#34C759" }}
            thumbColor="#ffffff"
          />
          <Text style={styles.notificationsLabel}>{STRINGS.notifications}</Text>
        </View>

        <TouchableOpacity
          onPress={onOpenLocation}
          activeOpacity={0.85}
          style={styles.locationButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.pinWrapper}>
            <Image source={pinIcon} style={styles.pinIcon} resizeMode="contain" />
            {isPinned && <View style={styles.pinDot} />}
          </View>

          <Text style={styles.locationLabel}>{openLocationLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 8,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  nameText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  infoBlock: {
    marginTop: 2,
    marginBottom: 2,
  },

  subText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
  },

  notificationsBlock: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationsLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textPrimary,
  },

  locationButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -4,          /* ryk PIN OP */
  },

  pinWrapper: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,       /* ingen luft under pin */
  },

  pinIcon: {
    width: 80,
    height: 80,
  },

  pinDot: {
    position: "absolute",
    bottom: 8,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00FFAA",
  },

  locationLabel: {
    marginTop: -4,         /* ryk TEKST op mod pin */
    marginBottom: 6,       /* lidt luft under teksten */
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
