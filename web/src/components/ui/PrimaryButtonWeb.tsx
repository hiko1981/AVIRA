import React from "react";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  wide?: boolean;
};

export default function PrimaryButtonWeb({
  variant = "primary",
  wide,
  className,
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-extrabold shadow-md border border-black/10 disabled:opacity-70 disabled:cursor-not-allowed";
  const palette =
    variant === "primary"
      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
      : "bg-gradient-to-r from-pink-100 to-purple-100 text-violet-800";
  const width = wide ? "w-full" : "";

  return (
    <button
      {...rest}
      className={clsx(base, palette, width, className)}
    >
      {children}
    </button>
  );
}
