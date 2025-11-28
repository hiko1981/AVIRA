import { headers } from "next/headers";

export type Lang = "da" | "en" | "tr";

const messages = {
  empty_title: {
    da: "Dette AVIRA armbånd er ikke aktiveret endnu.",
    en: "This AVIRA wristband is not activated yet.",
    tr: "Bu AVIRA bilekliği henüz etkinleştirilmemiş.",
  },
  empty_sub: {
    da: "Download AVIRA appen for at aktivere armbåndet og gøre det klar til brug.",
    en: "Download the AVIRA app to activate the wristband and get it ready for use.",
    tr: "Bilekliği etkinleştirmek ve kullanıma hazır hale getirmek için AVIRA uygulamasını indirin.",
  },
  used_title: {
    da: "Dette AVIRA armbånd er udløbet.",
    en: "This AVIRA wristband has expired.",
    tr: "Bu AVIRA bilekliğinin süresi dolmuş.",
  },
  used_sub: {
    da: "Åbn appen for at aktivere et nyt armbånd.",
    en: "Open the app to activate a new wristband.",
    tr: "Yeni bir bileklik etkinleştirmek için uygulamayı açın.",
  },
  cta_ios_top: {
    da: "Hent til iPhone",
    en: "Get for iPhone",
    tr: "iPhone için indir",
  },
  cta_ios_sub: {
    da: "Åbn App Store",
    en: "Open App Store",
    tr: "App Store'u aç",
  },
  cta_android_top: {
    da: "Hent til Android",
    en: "Get for Android",
    tr: "Android için indir",
  },
  cta_android_sub: {
    da: "Åbn Google Play",
    en: "Open Google Play",
    tr: "Google Play'i aç",
  },
  learn_more: {
    da: "Læs mere om AVIRA",
    en: "Learn more about AVIRA",
    tr: "AVIRA hakkında daha fazlası",
  },
} as const;

type MessageKey = keyof typeof messages;

export function t(key: MessageKey, lang: Lang): string {
  const entry = messages[key];
  if (!entry) return "";
  return entry[lang] ?? entry.da;
}

export async function pickLang(): Promise<Lang> {
  const h = await headers();
  const raw = h.get("accept-language") || "";
  const accept = raw.toLowerCase();

  if (accept.startsWith("en") || accept.includes(" en")) return "en";
  if (accept.startsWith("tr") || accept.includes(" tr")) return "tr";
  return "da";
}
