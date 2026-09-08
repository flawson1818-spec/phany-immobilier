import Link from "next/link";
import type { ComponentProps } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANTS = {
  primary: "bg-navy-700 text-white hover:bg-navy-800",
  gold: "bg-gold-500 text-white hover:bg-gold-600",
  bordeaux: "bg-bordeaux-500 text-white hover:bg-bordeaux-600",
  outline: "border border-navy-100 bg-white text-navy-700 hover:bg-navy-50",
  ghost: "text-navy-700 hover:bg-navy-50",
  danger: "border border-bordeaux-500 text-bordeaux-600 hover:bg-bordeaux-500 hover:text-white",
} as const;

type Variant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(BTN_BASE, VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BTN_BASE, VARIANTS[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-navy-100 bg-white p-5 shadow-[0_10px_30px_rgba(18,35,63,0.05)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cx("mb-1 block text-sm font-medium text-navy-800", className)} {...props} />
  );
}

const FIELD =
  "w-full rounded-lg border border-navy-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-100";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(FIELD, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(FIELD, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(FIELD, "bg-white", className)} {...props} />;
}

export function Badge({
  className,
  tone = "navy",
  ...props
}: ComponentProps<"span"> & { tone?: "navy" | "gold" | "bordeaux" | "green" | "gray" }) {
  const tones = {
    navy: "bg-navy-50 text-navy-700",
    gold: "bg-gold-400/15 text-gold-600",
    bordeaux: "bg-bordeaux-500/10 text-bordeaux-600",
    green: "bg-emerald-50 text-emerald-700",
    gray: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Alert({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "error" | "success";
}) {
  const tones = {
    info: "border-navy-100 bg-navy-50 text-navy-800",
    error: "border-bordeaux-500/30 bg-bordeaux-500/10 text-bordeaux-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return <div className={cx("rounded-lg border px-3 py-2 text-sm", tones[tone])}>{children}</div>;
}
