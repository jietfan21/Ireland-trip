"use client";

import { ExternalLink, Route } from "lucide-react";
import { dayNavigation, type DayNavigation } from "@/lib/dayNavigation";
import type { Day } from "@/lib/trip";
import { useApp } from "./common";

export default function FullDayNavigation({ day, compact = false }: { day: Day; compact?: boolean }) {
  const { lang } = useApp();
  const route: DayNavigation | null = dayNavigation(day);
  if (!route) return null;

  return (
    <section className={compact ? "rounded-2xl border border-line bg-card p-2.5" : "rounded-3xl border border-line bg-card p-4 shadow-[0_2px_10px_#17322d0d]"}>
      {!compact && (
        <div className="mb-3">
          <h3 className="text-[18px] font-bold">{lang === "zh" ? "全日 Google 地图路线" : "Full-day Google Maps route"}</h3>
          <p className="mt-1 text-[14px] text-sub">
            {lang === "zh" ? `按行程顺序包含全部 ${route.stopCount} 站` : `All ${route.stopCount} stops in the planned order`}
          </p>
        </div>
      )}
      <a
        href={route.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-shamrock px-3 font-bold text-white active:scale-[.98] ${compact ? "min-h-11 text-[15px]" : "min-h-14 text-[17px]"}`}
      >
        <Route size={compact ? 19 : 22} />
        {lang === "zh" ? "Google 地图 · 全部站点" : "Google Maps · All stops"}
        <ExternalLink size={compact ? 15 : 17} />
      </a>
      {route.partUrls.length > 1 && (
        <details className="group mt-2">
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
      )}
    </section>
  );
}
