"use client";

import { useEffect, useState } from "react";
import { Check, Footprints, UtensilsCrossed } from "lucide-react";
import type { LunchOption } from "@/lib/trip";
import { Card, useApp } from "./common";

export default function LunchChoices({ date, options }: { date: string; options: LunchOption[] }) {
  const { lang, p } = useApp();
  const [choice, setChoice] = useState<string | null>(null);
  const key = `ireland-trip:lunch:${date}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      setChoice(saved && options.some((o) => o.name === saved) ? saved : null);
    } catch {
      setChoice(null);
    }
  }, [key, options]);

  const select = (name: string) => {
    setChoice(name);
    try { window.localStorage.setItem(key, name); } catch { /* Still works without storage */ }
  };

  return (
    <Card>
      <h3 className="flex items-center gap-2 text-[18px] font-bold">
        <UtensilsCrossed size={21} className="text-shamrock" />
        {lang === "zh" ? "午餐：七选一（7 人）" : "Lunch: pick one for seven"}
      </h3>
      <p className="mt-1 text-[14px] leading-snug text-sub">
        {lang === "zh"
          ? "选一家再确认周六营业及订位。选择只储存在这部手机；每家都有步行导航。"
          : "Choose one, then check Saturday hours and reserve for seven. Your choice stays on this phone only; each has walking directions."}
      </p>
      <div className="mt-3 space-y-2">
        {options.map((o) => {
          const selected = choice === o.name;
          const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.query)}&travelmode=walking`;
          return (
            <div key={o.name} className={`flex items-center gap-2 rounded-2xl border p-2.5 ${selected ? "border-shamrock bg-shamrock-soft" : "border-line bg-cream"}`}>
              <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <input type="radio" name={`lunch-${date}`} checked={selected} onChange={() => select(o.name)} className="size-5 shrink-0 accent-shamrock" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-snug">{o.name} {selected && <Check size={15} className="inline text-shamrock" />}</span>
                  <span className="block text-[13px] leading-snug text-sub">{p(o.food)}</span>
                </span>
              </label>
              <a href={maps} target="_blank" rel="noopener noreferrer" aria-label={lang === "zh" ? `步行导航到 ${o.name}` : `Walking directions to ${o.name}`} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-shamrock px-2.5 text-[13px] font-semibold text-shamrock">
                <Footprints size={16} />
                {lang === "zh" ? "导航" : "Map"}
              </a>
            </div>
          );
        })}
      </div>
      {choice && <div className="mt-3 rounded-xl bg-shamrock-soft p-3 text-[14px] font-semibold text-shamrock"><Check size={16} className="mr-1 inline" />{lang === "zh" ? `已选：${choice}` : `Your lunch pick: ${choice}`}</div>}
    </Card>
  );
}
