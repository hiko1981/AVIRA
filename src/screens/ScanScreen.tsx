import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Linking
} from "react-native";
import {
  CameraView,
  useCameraPermissions
} from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { AviraBackground } from "../components/AviraBackground";
import { useAppInstallation } from "../context/AppInstallationContext";

type Status = "idle" | "scanning" | "checking" | "activating";
type WristbandStatus = "ledig" | "aktiv" | "brugt" | null;

const SHOP_URL = "https://qrlabel.one";

export default function ScanScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { appId, ready, deviceInfo } = useAppInstallation();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>("idle");

  const [scannedToken, setScannedToken] = useState<string | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");

  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);

  const [torchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const [activeModalVisible, setActiveModalVisible] = useState(false);
  const [expiredModalVisible, setExpiredModalVisible] = useState(false);
  const [onlineViewVisible, setOnlineViewVisible] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (permission.status === "granted" && status === "idle") {
      setStatus("scanning");
    }
  }, [permission, status]);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission, requestPermission]);

  const resetState = useCallback(() => {
    setStatus("scanning");
    setScannedToken(null);
    setScannedUrl(null);
    setShowForm(false);
    setChildName("");
    setParentName("");
    setPhone("");
    setErrorText(null);
    setInfoText(null);
    setActiveModalVisible(false);
    setExpiredModalVisible(false);
  }, []);

  const parseQr = (data: string): { token: string | null; url: string | null } => {
    try {
      const url = new URL(data);
      if (url.hostname !== "qrlabel.one") return { token: null, url: null };
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length !== 2) return { token: null, url: null };
      if (parts[0] !== "t") return { token: null, url: null };
      if (!parts[1] || parts[1].length < 4) return { token: null, url: null };
      return { token: parts[1], url: url.toString() };
    } catch {
      return { token: null, url: null };
    }
  };

  const checkWristbandStatus = async (tokenText: string) => {
    if (!appId) {
      setErrorText(t("scan.errorAppNotReady"));
      setStatus("idle");
      setTimeout(() => resetState(), 1800);
      return;
    }

    setErrorText(null);
    setStatus("checking");

    try {
      const { data, error } = await supabase.functions.invoke("wristband_status", {
        body: { token: tokenText, app_id: appId }
      });

      if (error || !data?.ok) {
        const msg = (data?.error as string) ?? "ukendt fejl";
        setErrorText(
          t("scan.errorLookupFailedWithMessage", { message: String(msg) })
        );
        setStatus("idle");
        setTimeout(() => resetState(), 1800);
        return;
      }

      const exists: boolean = !!data.exists;
      const st: WristbandStatus = data.status ?? null;

      if (!exists || st === "ledig" || !st) {
        setShowForm(true);
        setStatus("idle");
        return;
      }

      if (st === "aktiv") {
        setActiveModalVisible(true);
        setStatus("idle");
        return;
      }

      if (st === "brugt") {
        setExpiredModalVisible(true);
        setStatus("idle");
        return;
      }

      setShowForm(true);
      setStatus("idle");
    } catch {
      setErrorText(t("scan.errorLookupFailed"));
      setStatus("idle");
      setTimeout(() => resetState(), 1800);
    }
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (status !== "scanning") return;
    const data = result?.data as string;
    if (!data) return;

    const { token, url } = parseQr(data);
    if (!token || !url) {
      setErrorText(t("scan.errorUnknownQr"));
      setStatus("idle");
      setTimeout(() => resetState(), 1800);
      return;
    }

    setScannedToken(token);
    setScannedUrl(url);
    checkWristbandStatus(token);
  };

  const handleActivate = async () => {
    if (!ready || !appId) {
      setErrorText(t("scan.errorAppNotReady"));
      return;
    }

    if (!scannedToken) {
      setErrorText(t("scan.errorNoToken"));
      return;
    }

    setStatus("activating");
    setErrorText(null);

    let lat: number | null = null;
    let lng: number | null = null;
    let accuracy: number | null = null;

    try {
      const fg = await Location.getForegroundPermissionsAsync();
      let finalStatus = fg.status;

      if (finalStatus !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        accuracy =
          typeof pos.coords.accuracy === "number" ? pos.coords.accuracy : null;
      }
    } catch {
    }

    try {
      const payload = {
        token: scannedToken,
        app_id: appId,
        device_id: deviceInfo?.deviceId ?? null,
        child_name: childName,
        parent_name: parentName,
        phone,
        timezone: deviceInfo?.timezone ?? "Europe/Copenhagen",
        lat,
        lng,
        accuracy
      };

      const { data, error } = await supabase.functions.invoke(
        "wristband_activate",
        { body: payload }
      );

      if (error || !data?.ok) {
        const msg =
          (data?.error as string) ?? (data?.code as string) ?? "ukendt fejl";
        setErrorText(
          t("scan.errorActivateFailedWithMessage", { message: String(msg) })
        );
        setStatus("idle");
        return;
      }

      setShowForm(false);
      setInfoText(t("scan.infoActivated"));
      setStatus("idle");
      navigation.goBack();
    } catch {
      setErrorText(t("scan.errorActivateFailed"));
      setStatus("idle");
    }
  };

  const toggleTorch = () => {
    if (cameraReady) setTorchOn(!torchOn);
  };

  const hasCamPermission = permission?.status === "granted";

  const formValid =
    childName.trim() !== "" &&
    parentName.trim() !== "" &&
    phone.trim() !== "";

  const activateDisabled =
    !formValid || status === "activating" || !ready || !appId;

  const openOnlineView = () => {
    setActiveModalVisible(false);
    if (scannedUrl) {
      setOnlineViewVisible(true);
    }
  };

  const openShop = async () => {
    setExpiredModalVisible(false);
    try {
      await Linking.openURL(SHOP_URL);
    } catch {
    }
  };

  return (
    <AviraBackground overlayOpacity={0.12}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              paddingVertical: 6,
              paddingRight: 16,
              paddingLeft: 2,
              marginRight: 4
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                textShadowColor: "rgba(15,23,42,0.95)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8
              }}
            >
              {t("scan.back")}
            </Text>
          </Pressable>
        </View>

        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "white",
            marginBottom: 8,
            textShadowColor: "rgba(15,23,42,0.95)",
            textShadowOffset: { width: 0, height: 3 },
            textShadowRadius: 10
          }}
        >
          {t("scan.title")}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "white",
            marginBottom: 20,
            textShadowColor: "rgba(15,23,42,0.85)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 8
          }}
        >
          {t("scan.subtitle")}
        </Text>

        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            borderRadius: 24,
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0.25)"
          }}
        >
          {hasCamPermission ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={
                status === "scanning" ? handleBarCodeScanned : undefined
              }
              enableTorch={torchOn}
              onCameraReady={() => setCameraReady(true)}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 24
              }}
            >
              <Text
                style={{
                  color: "white",
                  textShadowColor: "rgba(0,0,0,0.8)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8
                }}
              >
                {t("scan.cameraPermissionNeeded")}
              </Text>
              <Pressable
                onPress={requestPermission}
                style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: "white",
                  borderRadius: 999
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {t("scan.cameraPermissionButton")}
                </Text>
              </Pressable>
            </View>
          )}

          {cameraReady && (
            <Pressable
              onPress={toggleTorch}
              style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: "rgba(15,23,42,0.9)"
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {torchOn ? t("scan.flashOff") : t("scan.flashOn")}
              </Text>
            </Pressable>
          )}
        </View>

        {errorText && (
          <Text
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(248,113,113,0.35)",
              color: "white",
              textShadowColor: "rgba(15,23,42,0.9)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6
            }}
          >
            {errorText}
          </Text>
        )}

        {infoText && (
          <Text
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(34,197,94,0.35)",
              color: "white",
              textShadowColor: "rgba(15,23,42,0.9)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6
            }}
          >
            {infoText}
          </Text>
        )}
      </View>

      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={60}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                backgroundColor: "rgba(0,0,0,0.3)"
              }}
            >
              <View
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  borderRadius: 32,
                  overflow: "hidden"
                }}
              >
                <ImageBackground
                  source={require("../../assets/background.png")}
                  imageStyle={{ borderRadius: 32, opacity: 0.45 }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.22)",
                      paddingHorizontal: 20,
                      paddingTop: 20,
                      paddingBottom: 40,
                      borderRadius: 32
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: "white",
                        marginBottom: 4,
                        textShadowColor: "rgba(15,23,42,0.95)",
                        textShadowOffset: { width: 0, height: 3 },
                        textShadowRadius: 10
                      }}
                    >
                      {t("scan.activateTitle")}
                    </Text>

                    <Text
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.9)",
                        marginBottom: 20,
                        textShadowColor: "rgba(15,23,42,0.9)",
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 8
                      }}
                    >
                      {t("scan.activateTokenLabel")} {scannedToken}
                    </Text>

                    <TextInput
                      placeholder={t("scan.childNamePlaceholder")}
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      value={childName}
                      onChangeText={setChildName}
                      style={{
                        backgroundColor: "rgba(0,0,0,0.25)",
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        marginBottom: 12,
                        color: "white"
                      }}
                    />

                    <TextInput
                      placeholder={t("scan.parentNamePlaceholder")}
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      value={parentName}
                      onChangeText={setParentName}
                      style={{
                        backgroundColor: "rgba(0,0,0,0.25)",
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        marginBottom: 12,
                        color: "white"
                      }}
                    />

                    <TextInput
                      placeholder={t("scan.phonePlaceholder")}
                      placeholderTextColor="rgba(255,255,255,0.78)"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.25)",
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        marginBottom: 24,
                        color: "white"
                      }}
                    />

                    <Pressable
                      onPress={handleActivate}
                      disabled={activateDisabled}
                      style={{
                        borderRadius: 999,
                        overflow: "hidden",
                        opacity: activateDisabled ? 0.5 : 1,
                        marginBottom: 18
                      }}
                    >
                      <LinearGradient
                        colors={["#38bdf8", "#a855f7", "#f97316"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          paddingVertical: 14,
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontWeight: "700",
                            textShadowColor: "rgba(15,23,42,0.9)",
                            textShadowOffset: { width: 0, height: 2 },
                            textShadowRadius: 8
                          }}
                        >
                          {t("scan.activateCta")}
                        </Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      onPress={() => setShowForm(false)}
                      style={{
                        paddingVertical: 14,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.4)",
                        alignItems: "center"
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "500",
                          textShadowColor: "rgba(15,23,42,0.8)",
                          textShadowOffset: { width: 0, height: 2 },
                          textShadowRadius: 6
                        }}
                      >
                        {t("scan.cancel")}
                      </Text>
                    </Pressable>
                  </View>
                </ImageBackground>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={activeModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.45)"
          }}
        >
          <View
            style={{
              width: "86%",
              borderRadius: 28,
              overflow: "hidden"
            }}
          >
            <ImageBackground
              source={require("../../assets/background.png")}
              imageStyle={{ borderRadius: 28, opacity: 0.5 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(15,23,42,0.55)",
                  paddingHorizontal: 20,
                  paddingVertical: 24,
                  borderRadius: 28
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: "white",
                    marginBottom: 8,
                    textShadowColor: "rgba(0,0,0,0.9)",
                    textShadowOffset: { width: 0, height: 3 },
                    textShadowRadius: 10
                  }}
                >
                  {t("scan.modalActiveTitle")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.92)",
                    marginBottom: 20
                  }}
                >
                  {t("scan.modalActiveBody")}
                </Text>

                <Pressable
                  onPress={openOnlineView}
                  style={{
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 12
                  }}
                >
                  <LinearGradient
                    colors={["#38bdf8", "#a855f7", "#f97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700"
                      }}
                    >
                      {t("scan.modalActiveOpenOnline")}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setActiveModalVisible(false);
                    resetState();
                  }}
                  style={{
                    paddingVertical: 13,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    alignItems: "center"
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "500"
                    }}
                  >
                    {t("scan.modalClose")}
                  </Text>
                </Pressable>
              </View>
            </ImageBackground>
          </View>
        </View>
      </Modal>

      <Modal visible={expiredModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.45)"
          }}
        >
          <View
            style={{
              width: "86%",
              borderRadius: 28,
              overflow: "hidden"
            }}
          >
            <ImageBackground
              source={require("../../assets/background.png")}
              imageStyle={{ borderRadius: 28, opacity: 0.5 }}
            >
              <View
                style={{
                  backgroundColor: "rgba(15,23,42,0.55)",
                  paddingHorizontal: 20,
                  paddingVertical: 24,
                  borderRadius: 28
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: "white",
                    marginBottom: 8,
                    textShadowColor: "rgba(0,0,0,0.9)",
                    textShadowOffset: { width: 0, height: 3 },
                    textShadowRadius: 10
                  }}
                >
                  {t("scan.modalExpiredTitle")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.92)",
                    marginBottom: 20
                  }}
                >
                  {t("scan.modalExpiredBody")}
                </Text>

                <Pressable
                  onPress={openShop}
                  style={{
                    borderRadius: 999,
                    overflow: "hidden",
                    marginBottom: 12
                  }}
                >
                  <LinearGradient
                    colors={["#38bdf8", "#a855f7", "#f97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700"
                      }}
                    >
                      {t("scan.modalExpiredCta")}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setExpiredModalVisible(false);
                    resetState();
                  }}
                  style={{
                    paddingVertical: 13,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    alignItems: "center"
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "500"
                    }}
                  >
                    {t("scan.modalClose")}
                  </Text>
                </Pressable>
              </View>
            </ImageBackground>
          </View>
        </View>
      </Modal>

      <Modal visible={onlineViewVisible} animationType="slide">
        <AviraBackground overlayOpacity={0.2}>
          <View
            style={{
              flex: 1,
              paddingTop: 32,
              paddingHorizontal: 16
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12
              }}
            >
              <Pressable
                onPress={() => setOnlineViewVisible(false)}
                style={{
                  paddingVertical: 6,
                  paddingRight: 16,
                  paddingLeft: 2,
                  marginRight: 4
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    textShadowColor: "rgba(15,23,42,0.95)",
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8
                  }}
                >
                  {t("scan.modalClose")}
                </Text>
              </Pressable>
              <Text
                style={{
                  color: "white",
                  fontSize: 20,
                  fontWeight: "700",
                  textShadowColor: "rgba(15,23,42,0.95)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8
                }}
              >
                {t("scan.onlineViewTitle")}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderRadius: 24,
                overflow: "hidden",
                backgroundColor: "white"
              }}
            >
              <WebView
                source={{ uri: scannedUrl ?? SHOP_URL }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </AviraBackground>
      </Modal>
    </AviraBackground>
  );
}
