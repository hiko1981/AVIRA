import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avira Wristband",
  description: "Avira wristband token page",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className="min-h-screen w-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#DDE8FF,_#EED9FF_55%,_#FFD3EA_100%)] text-slate-900">
        {props.children}
      </body>
    </html>
  );
}
