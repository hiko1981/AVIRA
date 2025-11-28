import React from "react";
import { t, type Lang } from "@/lib/i18n";
import PrimaryButtonWeb from "@/components/ui/PrimaryButtonWeb";

type Props = {
  lang: Lang;
};

export default function AvailablePanel({ lang }: Props) {
  const title =
    t("empty_title", lang) ||
    (lang === "en"
      ? "This AVIRA wristband is not activated yet."
      : "Dette AVIRA armbånd er ikke aktiveret endnu.");

  const subtitle =
    t("empty_sub", lang) ||
    (lang === "en"
      ? "Download the AVIRA app to activate the wristband and get it ready for use."
      : "Download AVIRA appen for at aktivere armbåndet og gøre det klar til brug.");

  const iosUrl = "https://apps.apple.com/app/";
  const androidUrl = "https://play.google.com/store";

  return (
    <>
      <h1 className="mb-1 text-2xl font-black leading-snug tracking-tight text-transparent bg-gradient-to-r from-purple-800 to-fuchsia-600 bg-clip-text sm:text-3xl">
        {title}
      </h1>
      <p className="mb-4 max-w-xl text-sm font-semibold text-slate-800 sm:text-base">
        {subtitle}
      </p>

      <div className="mt-2 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center">
        <a href={iosUrl} className="flex-1">
          <PrimaryButtonWeb wide>
            <div className="leading-tight">
              <span className="block text-lg">
                {t("cta_ios_top", lang) ||
                  (lang === "en" ? "Get for iPhone" : "Hent til iPhone")}
              </span>
              <span className="block text-xs font-semibold opacity-90">
                {t("cta_ios_sub", lang) ||
                  (lang === "en" ? "Open App Store" : "Åbn App Store")}
              </span>
            </div>
          </PrimaryButtonWeb>
        </a>

        <a href={androidUrl} className="flex-1">
          <PrimaryButtonWeb wide>
            <div className="leading-tight">
              <span className="block text-lg">
                {t("cta_android_top", lang) ||
                  (lang === "en" ? "Get for Android" : "Hent til Android")}
              </span>
              <span className="block text-xs font-semibold opacity-90">
                {t("cta_android_sub", lang) ||
                  (lang === "en" ? "Open Google Play" : "Åbn Google Play")}
              </span>
            </div>
          </PrimaryButtonWeb>
        </a>
      </div>
    </>
  );
}
