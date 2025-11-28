import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation-types";
import { AviraBackground } from "../components/AviraBackground";
import { PrimaryButton } from "../components/PrimaryButton";
import WristbandCard from "../components/WristbandCard";
import colors from "../theme/colors";
import { useAppInstallation } from "../context/AppInstallationContext";
import { supabase } from "../lib/supabase";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

type WristbandRow = {
  id: string;
  child_name: string | null;
  expires_at: string | null;
  updated_at: string | null;
  last_scan_at?: string | null;
  push_enabled: boolean | null;
  status: string | null;
  owner_app_id: string | null;
};

type Wristband = {
  id: string;
  childName: string | null;
  expiresAt: string | null;
  lastScanAt: string | null;
  pushEnabled: boolean;
};

export function DashboardScreen({ navigation, route }: Props) {
  const { appId: appIdFromContext } = useAppInstallation();
  const appId = route.params?.appId ?? appIdFromContext ?? null;

  const [wristbands, setWristbands] = useState<Wristband[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWristbands = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!appId) {
        setWristbands([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (opts?.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { data, error: dbError } = await supabase
          .from("wristbands")
          .select(
            "id, child_name, expires_at, updated_at, last_scan_at, push_enabled, status, owner_app_id"
          )
          .eq("owner_app_id", appId)
          .eq("status", "aktiv")
          .order("updated_at", { ascending: false });

        if (dbError) {
          console.log("Dashboard loadWristbands error", dbError);
          setError(dbError.message ?? "Ukendt fejl");
          setWristbands([]);
        } else if (data) {
          const mapped: Wristband[] = (data as WristbandRow[]).map((row) => ({
            id: row.id,
            childName: row.child_name ?? null,
            expiresAt: row.expires_at ?? null,
            lastScanAt: row.last_scan_at ?? row.updated_at ?? null,
            pushEnabled: row.push_enabled ?? true,
          }));
          setWristbands(mapped);
          setError(null);
        }
      } catch (e: any) {
        console.log("Dashboard loadWristbands exception", e);
        setError(e?.message ?? "Ukendt fejl");
        setWristbands([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [appId]
  );

  useEffect(() => {
    loadWristbands();
  }, [loadWristbands]);

  const latestScannedId = useMemo(() => {
    let latestId: string | null = null;
    let latestTs = -Infinity;
    for (const wb of wristbands) {
      const src = wb.lastScanAt || wb.expiresAt;
      if (!src) continue;
      const t = new Date(src).getTime();
      if (!isFinite(t)) continue;
      if (t > latestTs) {
        latestTs = t;
        latestId = wb.id;
      }
    }
    return latestId;
  }, [wristbands]);

  const handleAddPress = useCallback(() => {
    navigation.navigate("Scan" as never);
  }, [navigation]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate("Settings" as never, { appId } as never);
  }, [navigation, appId]);

  const handleOpenLocation = useCallback(
    (wristbandId: string) => {
      navigation.navigate("Map" as never, { wristbandId, appId } as never);
    },
    [navigation, appId]
  );

  const handleTogglePush = useCallback((wristbandId: string, next: boolean) => {
    console.log("Toggle push for", wristbandId, "->", next);
  }, []);

  const hasWristbands = wristbands.length > 0;

  return (
    <AviraBackground>
      <View style={styles.screen}>
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Dine armbånd</Text>
            <TouchableOpacity
              onPress={handleSettingsPress}
              style={styles.settingsButton}
            >
              <Text style={styles.settingsLabel}>Indstillinger</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusBlock}>
            {isLoading && !hasWristbands ? (
              <Text style={styles.statusText}>Henter armbånd...</Text>
            ) : hasWristbands ? (
              <Text style={styles.statusText}>
                Aktive armbånd: {wristbands.length}
              </Text>
            ) : (
              <Text style={styles.statusText}>
                Du har ingen armbånd endnu.
              </Text>
            )}
            {error && (
              <Text style={styles.errorText}>Fejl: {error}</Text>
            )}
          </View>
        </View>

        <View style={styles.listWrapper}>
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            scrollEnabled
            showsVerticalScrollIndicator={wristbands.length > 3}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadWristbands({ refresh: true })}
                tintColor={colors.primary}
              />
            }
          >
            {hasWristbands ? (
              <View style={styles.listContainer}>
                {wristbands.map((wristband, index) => (
                  <WristbandCard
                    key={wristband.id}
                    id={wristband.id}
                    name={wristband.childName || "Navn ikke angivet"}
                    expiresAt={wristband.expiresAt}
                    lastSeenAt={wristband.lastScanAt}
                    pushEnabled={wristband.pushEnabled}
                    onTogglePush={(next) =>
                      handleTogglePush(wristband.id, next)
                    }
                    onOpenLocation={() =>
                      handleOpenLocation(wristband.id)
                    }
                    index={index}
                    isPinned={wristband.id === latestScannedId}
                  />
                ))}
              </View>
            ) : (
              !isLoading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    Ingen aktive armbånd endnu
                  </Text>
                  <Text style={styles.emptyBody}>
                    Tryk på knappen herunder for at tilføje dit første armbånd.
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <PrimaryButton label="Tilføj armbånd" onPress={handleAddPress} />
        </View>
      </View>
    </AviraBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  topSection: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  statusBlock: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.error,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  listWrapper: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  listContainer: {
    gap: 12,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyBody: {
    fontSize: 15,
    color: colors.textSecondary,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    paddingTop: 16,
  },
});

export default DashboardScreen;
