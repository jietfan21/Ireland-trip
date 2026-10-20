"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ListChecks } from "lucide-react";
import { days, TRIP_END, TRIP_START } from "@/lib/trip";
import { useWeather } from "@/lib/weather";
import Crew from "./Crew";
import DayView from "./DayView";
import { daysBetween, irelandToday, useApp } from "./common";

function todayIndex(today: string) {
  if (today < TRIP_START) return 0;
  if (today > TRIP_END) return days.length - 1;
  return Math.max(0, days.findIndex((d) => d.date === today));
}

export default function TodayView({ jumpTo }: { jumpTo?: number }) {
  const { t, p, person, go } = useApp();
  const [today, setToday] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const d = irelandToday();
    setToday(d);
    setIdx(jumpTo ?? todayIndex(d));
  }, [jumpTo]);

  const real = useMemo(() => (today ? todayIndex(today) : 0), [today]);
  const day = days[idx];
  const weather = useWeather(day);
  if (!today) return null;

  const before = today < TRIP_START ? daysBetween(today, TRIP_START) : 0;
  const after = today > TRIP_END;
  const isPreview = idx !== real || before > 0;

  return (
    <div className="space-y-4">
      {person && <p className="text-[17px] text-sub">{t("hi", { name: p(person) })} 👋</p>}
      <Crew day={day} />

      {before > 0 && (
        <button
          onClick={() => go("tools")}
          className="flex w-full items-center justify-between gap-3 rounded-3xl bg-ink p-5 text-left text-white active:scale-[.99]"
        >
          <div>
            <div className="text-[24px] font-bold leading-tight">{before === 1 ? t("tomorrow") : t("countdown", { n: before })}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[15px] opacity-80">
              <ListChecks size={18} /> {t("checklist")} →
            </div>
          </div>
          <span className="text-5xl">☘️</span>
        </button>
      )}
      {after && <div className="rounded-3xl bg-ink p-5 text-[20px] font-bold text-white">{t("tripOver")}</div>}

      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="previous day"
          disabled={idx === 0}
          onClick={() => setIdx(idx - 1)}
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-card disabled:opacity-30"
        >
          <ChevronLeft />
        </button>
        <div className="text-center text-[15px] font-semibold text-sub">
          {isPreview ? (
            <button onClick={() => setIdx(real)} className="rounded-full bg-shamrock-soft px-4 py-2 text-shamrock">
              {before > 0 ? t("previewing") : t("backToday")}
            </button>
          ) : (
            t("today")
          )}
        </div>
        <button
          aria-label="next day"
          disabled={idx === days.length - 1}
          onClick={() => setIdx(idx + 1)}
          className="grid h-12 w-12 place-items-center rounded-full border border-line bg-card disabled:opacity-30"
        >
          <ChevronRight />
        </button>
      </div>

      <DayView day={day} weather={weather} />
    </div>
  );
}
