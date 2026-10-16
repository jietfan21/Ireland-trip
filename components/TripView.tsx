"use client";

import { ChevronRight } from "lucide-react";
import { days, stayById } from "@/lib/trip";
import { fmtDate, irelandToday, useApp } from "./common";

export default function TripView() {
  const { lang, t, p, go } = useApp();
  const today = irelandToday();

  return (
    <div className="space-y-2.5">
      <h2 className="px-1 text-[22px] font-bold">{t("allDays")}</h2>
      {days.map((d, i) => {
        const stay = stayById(d.stay);
        const isToday = d.date === today;
        return (
          <button
            key={d.n}
            onClick={() => go("today", i)}
            className={`flex w-full items-center gap-3 rounded-3xl border bg-card p-3 text-left active:scale-[.99] ${
              isToday ? "border-shamrock ring-2 ring-shamrock/30" : "border-line"
            }`}
          >
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center text-white"
              style={{ background: d.color }}
            >
              <span className="text-[20px] font-bold leading-none">{d.n === 0 ? "✈️" : d.n === 14 ? "🏠" : d.n}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-sub">
                {fmtDate(d.date, lang)}
                {isToday && <span className="ml-2 rounded-full bg-shamrock px-2 py-0.5 text-[12px] font-bold text-white">{t("today")}</span>}
              </span>
              <span className="block text-[17px] font-bold leading-snug">{p(d.title)}</span>
              {stay && <span className="block truncate text-[14px] text-sub">🛏 {p(stay.town)}</span>}
            </span>
            <ChevronRight className="shrink-0 text-sub" />
          </button>
        );
      })}
    </div>
  );
}
