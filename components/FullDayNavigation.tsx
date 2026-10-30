"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Route } from "lucide-react";
import { dayNavigation, routeNavigation, type DayNavigation } from "@/lib/dayNavigation";
import { places, stayById, type Day } from "@/lib/trip";
import { useApp } from "./common";

function stopName(id: string, lang: "zh" | "en"): string {
  if (id.startsWith("@")) {
    const stay = stayById(id.slice(1));
    return stay ? `${stay.town[lang]} · ${stay.name}` : id;
  }
  return places[id]?.[lang] ?? id;
}

function RouteParts({ route, lang }: { route: DayNavigation; lang: "zh" | "en" }) {
  if (route.partUrls.length <= 1) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer py-2 text-[13px] font-semibold text-shamrock">
        {lang === "zh" ? "手机没显示全部站点？分段导航 ▾" : "Missing stops on your phone? Open route in parts ▾"}
      </summary>
      <div className="flex flex-wrap gap-2 pb-1">
        {route.partUrls.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-shamrock bg-shamrock-soft px-3 py-2 text-[14px] font-semibold text-shamrock"
          >
            {lang === "zh" ? `第 ${i + 1} 段` : `Part ${i + 1}`}
            <ExternalLink size={14} />
          </a>
        ))}
      </div>
      <p className="text-[12px] leading-snug text-sub">
        {lang === "zh" ? "依次打开各段路线；每段最多 3 个中途站点，适用于手机浏览器。" : "Open each part in order. Each contains at most 3 intermediate stops for mobile browsers."}
      </p>
    </details>
  );
}

export default function FullDayNavigation({ day, compact = false }: { day: Day; compact?: boolean }) {
  const { lang } = useApp();
  const fullRoute = dayNavigation(day);
  const [checked, setChecked] = useState<boolean[]>(() => day.stops.map(() => true));
  const [fromCurrentLocation, setFromCurrentLocation] = useState(false);

  if (!fullRoute) return null;
  const selectedIds = day.stops.filter((_, index) => checked[index]);
  const selectedRoute = routeNavigation(selectedIds, fromCurrentLocation);
  const firstSelectedIndex = checked.findIndex(Boolean);

  const setOne = (index: number, value: boolean) => {
    setChecked((before) => before.map((old, i) => i === index ? value : old));
  };
  const startHere = (index: number) => {
    setChecked(day.stops.map((_, i) => i >= index));
    setFromCurrentLocation(false);
  };

  return (
    <section className={compact ? "rounded-2xl border border-line bg-card p-2.5" : "rounded-3xl border border-line bg-card p-4 shadow-[0_2px_10px_#17322d0d]"}>
      {!compact && (
        <div className="mb-3">
          <h3 className="text-[18px] font-bold">{lang === "zh" ? "全日 Google 地图路线" : "Full-day Google Maps route"}</h3>
          <p className="mt-1 text-[14px] text-sub">
            {lang === "zh" ? `按行程顺序包含全部 ${fullRoute.stopCount} 站` : `All ${fullRoute.stopCount} stops in the planned order`}
          </p>
        </div>
      )}
      <a
        href={fullRoute.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-shamrock px-3 font-bold text-white active:scale-[.98] ${compact ? "min-h-11 text-[15px]" : "min-h-14 text-[17px]"}`}
      >
        <Route size={compact ? 19 : 22} />
        {lang === "zh" ? "Google 地图 · 全部站点" : "Google Maps · All stops"}
        <ExternalLink size={compact ? 15 : 17} />
      </a>
      <RouteParts route={fullRoute} lang={lang} />

      <details className={`mt-2 rounded-2xl bg-cream px-3 py-2 ${compact ? "max-h-[42vh] overflow-y-auto" : ""}`}>
        <summary className="min-h-9 cursor-pointer py-1 text-[14px] font-bold text-shamrock">
          {lang === "zh" ? `☑ 自选站点 · 已选 ${selectedIds.length} 站` : `☑ Choose stops · ${selectedIds.length} selected`}
        </summary>
        <p className="mt-2 text-[13px] leading-snug text-sub">
          {lang === "zh"
            ? "勾选想去的站点。路线从第一个勾选站点开始；也可以点「从这里开始」跳过前面站点。"
            : "Tick the places you want. The route starts at the first ticked stop, or tap Start here to skip earlier stops."}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setChecked(day.stops.map(() => true))} className="min-h-10 text-[13px] font-semibold text-shamrock underline">
            {lang === "zh" ? "全选" : "Select all"}
          </button>
          <button type="button" onClick={() => setChecked(day.stops.map(() => false))} className="min-h-10 text-[13px] font-semibold text-sub underline">
            {lang === "zh" ? "清除选择" : "Clear"}
          </button>
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {day.stops.map((id, i) => (
            <div key={i} className="flex min-h-12 items-center gap-2 rounded-xl bg-card px-2 py-1.5">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(checked[i])}
                  onChange={(e) => setOne(i, e.target.checked)}
                  className="size-5 shrink-0 accent-shamrock"
                />
                <span className="min-w-0 text-[13px] leading-snug">
                  <span className="mr-1 text-sub">{i + 1}.</span>
                  {stopName(id, lang)}
                  {checked[i] && firstSelectedIndex === i && !fromCurrentLocation && (
                    <span className="ml-1 rounded-full bg-shamrock-soft px-1.5 py-0.5 text-[11px] font-bold text-shamrock">
                      {lang === "zh" ? "起点" : "Start"}
                    </span>
                  )}
                </span>
              </label>
              <button
                type="button"
                onClick={() => startHere(i)}
                className="min-h-10 shrink-0 rounded-xl border border-line px-2 text-[12px] font-semibold text-shamrock"
                aria-label={lang === "zh" ? `从 ${stopName(id, lang)} 开始` : `Start at ${stopName(id, lang)}`}
              >
                {lang === "zh" ? "从这里开始" : "Start here"}
              </button>
            </div>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3 py-3 text-[14px] font-semibold">
          <input
            type="checkbox"
            checked={fromCurrentLocation}
            onChange={(e) => setFromCurrentLocation(e.target.checked)}
            className="size-5 shrink-0 accent-shamrock"
          />
          <MapPin size={17} className="shrink-0 text-shamrock" />
          {lang === "zh" ? "从我目前的位置出发" : "Start from my current location"}
        </label>
        {selectedRoute ? (
          <a
            href={selectedRoute.fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-shamrock px-3 text-center text-[15px] font-bold text-white active:scale-[.98]"
          >
            <Route size={18} />
            {lang === "zh" ? `Google 地图 · 导航已选 ${selectedRoute.stopCount} 站` : `Google Maps · Navigate ${selectedRoute.stopCount} selected`}
            <ExternalLink size={16} />
          </a>
        ) : (
          <p className="mt-3 rounded-xl bg-card px-3 py-3 text-center text-[13px] font-semibold text-sub">
            {lang === "zh"
              ? (fromCurrentLocation ? "请至少勾选一个目的地。" : "请至少勾选两个站点（起点和终点）。")
              : (fromCurrentLocation ? "Choose at least one destination." : "Choose at least two stops (start and destination).")}
          </p>
        )}
        {selectedRoute && <RouteParts route={selectedRoute} lang={lang} />}
      </details>
    </section>
  );
}
