import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function AviraWebBackground({ children }: Props) {
  return (
    <div className="min-h-screen w-full bg-[#020617]">
      <div
        className="relative min-h-screen w-full overflow-hidden"
        style={{
          backgroundImage: 'url("/avira/background.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src="/avira/watermark.png"
            alt=""
            className="w-[140vw] max-w-[900px] opacity-25 -translate-y-[4vh]"
          />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-start px-4 pt-[9vh] pb-32 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
