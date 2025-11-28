import React from "react";
import AviraWebBackground from "@/components/ui/AviraWebBackground";
import { t, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  children: React.ReactNode;
};

export default function TokenLayout({ lang, children }: Props) {
  return (
    <AviraWebBackground>
      <main className="w-full max-w-3xl">
        <section className="relative w-full overflow-hidden rounded-[28px] border border-white/25 bg-white/8 px-4 py-6 text-center shadow-[0_22px_46px_rgba(15,23,42,0.65)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 opacity-35">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(255,255,255,0)_65%)]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            {children}
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-16 px-4 sm:bottom-20">
        <a
          href="https://qrlabel.one/"
          className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center justify-center rounded-2xl border border-white/35 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-4 text-center text-base font-extrabold text-white shadow-[0_18px_40px_rgba(15,23,42,0.7)]"
        >
          {t("learn_more", lang)}
        </a>
      </div>
    </AviraWebBackground>
  );
}
