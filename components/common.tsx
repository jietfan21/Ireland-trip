"use client";

import { createContext, useContext } from "react";
import { Navigation, Phone } from "lucide-react";
import type { Lang, UiKey } from "@/lib/i18n";
import { tr } from "@/lib/i18n";
import type { L, Person } from "@/lib/trip";

export type Tab = "today" | "trip" | "map" | "info" | "tools";

type Ctx = {
  lang: Lang;
  person: Person | null;
  go: (tab: Tab, day?: number) => void;
};

export const AppCtx = createContext<Ctx>({ lang: "zh", person: null, go: () => {} });

export function useApp() {
  const c = useContext(AppCtx);
  return {
    ...c,
    t: (k: UiKey, v?: Record<string, string | number>) => tr(c.lang, k, v),
    p: (l: L) => l[c.lang],
  };
}

const WEEK_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const WEEK_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(iso: string, lang: Lang) {
  const [y, m, d] = iso.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return lang === "zh" ? `${m}月${d}日 ${WEEK_ZH[w]}` : `${WEEK_EN[w]} ${d} ${MON_EN[m - 1]}`;
}

// Today's date in Ireland, as YYYY-MM-DD.
export function irelandToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(new Date());
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export function NavButton({ href, label, big }: { href: string; label: string; big?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-shamrock font-semibold text-white active:scale-[.97] ${
        big ? "min-h-14 flex-1 px-5 text-lg" : "min-h-11 px-4 text-base"
      }`}
    >
      <Navigation size={big ? 22 : 18} />
      {label}
    </a>
  );
}

export function CallButton({ phone, label, big }: { phone: string; label: string; big?: boolean }) {
  return (
    <a
      href={`tel:${phone}`}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-shamrock font-semibold text-shamrock active:scale-[.97] ${
        big ? "min-h-14 flex-1 px-5 text-lg" : "min-h-11 px-4 text-base"
      }`}
    >
      <Phone size={big ? 22 : 18} />
      {label}
    </a>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-card p-4 shadow-[0_2px_10px_#17322d0d] ${className}`}>{children}</section>;
}

export function Avatar({ person, size = 44 }: { person: Person; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: person.color, fontSize: size * 0.42 }}
    >
      {person.zh.slice(-1)}
    </span>
  );
}
