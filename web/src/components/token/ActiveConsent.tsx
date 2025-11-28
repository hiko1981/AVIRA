"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type UiState = "idle" | "locating" | "sent" | "error" | "no";

type Props = {
  token: string;
  childName: string | null;
  parentName: string | null;
  phone: string | null;
  lang: "da" | "en" | "tr";
};

function detectSource(userAgent: string | null): string {
  if (!userAgent) return "web_unknown";
  const ua = userAgent.toLowerCase();
  if (
    ua.includes("iphone") ||
    ua.includes("ipad") ||
    ua.includes("android") ||
    ua.includes("mobile")
  ) {
    return "web_mobile";
  }
  return "web_desktop";
}

async function insertScan(opts: {
  tokenText: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  consent: boolean;
}) {
  const supabase = getSupabaseClient();
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : null;
  const source = detectSource(userAgent);

  const { error } = await supabase.from("scan_logs").insert({
    token_text: opts.tokenText,
    lat: opts.lat,
    lng: opts.lng,
    accuracy: opts.accuracy,
    consent: opts.consent,
    source,
    user_agent: userAgent,
  });

  if (error) {
    console.error("ActiveConsent: insert scan_logs error", error);
    throw error;
  }
}

export default function ActiveConsent(props: Props) {
  const [state, setState] = useState<UiState>("idle");
  const [error, setError] = useState<string | null>(null);

  const childLabel = props.childName ?? "et barn";
  const parentLabel =
    props.parentName ??
    (props.lang === "en"
      ? "their parents"
      : props.lang === "tr"
      ? "aileleri"
      : "hendes forældre");

  const phoneLabel =
    props.lang === "en"
      ? "You can also call directly at"
      : props.lang === "tr"
      ? "Ayrıca doğrudan şu numaradan arayabilirsiniz"
      : "Du kan også ringe direkte på";

  const shareLabel =
    props.lang === "en"
      ? "Share my location"
      : props.lang === "tr"
      ? "Konumumu paylaş"
      : "Del min lokation";

  const noShareLabel =
    props.lang === "en"
      ? "Do not share my location"
      : props.lang === "tr"
      ? "Konumumu paylaşma"
      : "Del ikke min lokation";

  const callLabel =
    props.lang === "en"
      ? "Call"
      : props.lang === "tr"
      ? "Ara"
      : "Ring til";

  const locatingLabel =
    props.lang === "en"
      ? "Getting location…"
      : props.lang === "tr"
      ? "Konum alınıyor…"
      : "Henter lokation…";

  const sentLabel =
    props.lang === "en"
      ? "Location shared"
      : props.lang === "tr"
      ? "Konum paylaşıldı"
      : "Lokation delt";

  const thankShare =
    props.lang === "en"
      ? "Thank you. Your location has been shared with the parents."
      : props.lang === "tr"
      ? "Teşekkürler. Konumunuz ebeveynlerle paylaşıldı."
      : "Tak. Din lokation er delt med forældrene.";

  const thankNoShare =
    props.lang === "en"
      ? "Thank you for scanning the wristband."
      : props.lang === "tr"
      ? "Bilekliği taradığınız için teşekkürler."
      : "Tak fordi du scannede armbåndet.";

  const errorLocation =
    props.lang === "en"
      ? "Could not get your location."
      : props.lang === "tr"
      ? "Konumunuz alınamadı."
      : "Kunne ikke hente din lokation.";

  const errorSend =
    props.lang === "en"
      ? "An error occurred while sending location."
      : props.lang === "tr"
      ? "Konum gönderilirken bir hata oluştu."
      : "Der opstod en fejl under afsendelse af lokation.";

  const noteText =
    props.lang === "en"
      ? "By accepting, you share your location once, anonymously, with the wristband owner. No continuous tracking is performed."
      : props.lang === "tr"
      ? "Kabul ederek konumunuzu bileklik sahibine bir kez ve anonim olarak paylaşırsınız. Sürekli takip yapılmaz."
      : "Ved at acceptere deler du din lokation nu og her – anonymt – med ejeren af armbåndet. Der foretages ikke løbende sporing.";

  async function handleShareLocation() {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("error");
      setError(errorLocation);
      return;
    }

    setState("locating");

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          await insertScan({
            tokenText: props.token,
            lat: latitude,
            lng: longitude,
            accuracy: accuracy ?? null,
            consent: true,
          });
          setState("sent");
        } catch {
          setState("error");
          setError(errorSend);
        }
      },
      () => {
        setState("error");
        setError(errorLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleNoLocation() {
    setError(null);
    try {
      await insertScan({
        tokenText: props.token,
        lat: null,
        lng: null,
        accuracy: null,
        consent: false,
      });
      setState("no");
    } catch {
      setState("error");
      setError(errorSend);
    }
  }

  const isBusy = state === "locating";

  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <h1 className="text-2xl font-black leading-tight bg-gradient-to-r from-purple-800 to-fuchsia-500 bg-clip-text text-transparent">
        {props.lang === "en"
          ? `You have found ${childLabel}.`
          : props.lang === "tr"
          ? `${childLabel} çocuğunu buldunuz.`
          : `Du har fundet ${childLabel}.`}
      </h1>

      <p className="text-base font-semibold text-slate-900">
        {props.lang === "en"
          ? `Would you like to share your location so ${parentLabel} can find you?`
          : props.lang === "tr"
          ? `Konumunuzu paylaşarak ${parentLabel} sizi daha kolay bulsun ister misiniz?`
          : `Vil du dele din lokation, så ${parentLabel} kan finde jer?`}
      </p>

      {props.phone && (
        <p className="text-sm text-slate-800">
          {phoneLabel}{" "}
          <a href={`tel:${props.phone}`} className="underline font-semibold">
            {props.phone}
          </a>
          .
        </p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={handleShareLocation}
          disabled={isBusy || state === "sent"}
          className="inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-base font-bold text-white shadow-md border border-black/10 bg-gradient-to-r from-violet-600 to-fuchsia-500 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {state === "locating"
            ? locatingLabel
            : state === "sent"
            ? sentLabel
            : shareLabel}
        </button>

        {props.phone && (
          <a
            href={`tel:${props.phone}`}
            className="inline-flex w-full items-center justify-center rounded-full px-7 py-3 text-base font-bold text-slate-900 shadow-md border border-black/10 bg-white/70 backdrop-blur"
          >
            {callLabel} {props.phone}
          </a>
        )}

        <button
          type="button"
          onClick={handleNoLocation}
          disabled={isBusy}
          className="mt-2 text-sm font-semibold underline text-slate-900 disabled:opacity-50"
        >
          {noShareLabel}
        </button>
      </div>

      {(state === "sent" || state === "no") && (
        <p className="text-sm text-emerald-700 font-medium">
          {state === "sent" ? thankShare : thankNoShare}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 font-medium">
          {error}
        </p>
      )}

      <p className="mt-2 text-xs text-slate-700 max-w-md">
        {noteText}
      </p>
    </div>
  );
}
