"use client";

import { useEffect, useState } from "react";
import { Check, MapPin, UtensilsCrossed } from "lucide-react";
import { googleMapsSearchUrl, type LunchOption } from "@/lib/trip";
import { Card, useApp } from "./common";

export default function LunchChoices({ date, options, meal = "lunch" }: { date: string; options: LunchOption[]; meal?: "lunch" | "dinner" }) {
  const { lang, p } = useApp();
  const [choice, setChoice] = useState<string | null>(null);
  const key = `ireland-trip:${meal}:${date}`;
  const isDinner = meal === "dinner";
  const roadTrip = date === "2026-11-01";
  const longTransferDay = date === "2026-11-05";
  const dingleTownDay = date === "2026-11-02";
  const dayOfWeek = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-IE", { weekday: "long", timeZone: "Europe/Dublin" });
  const dayOfWeekZh = new Date(`${date}T12:00:00Z`).toLocaleDateString("zh-CN", { weekday: "long", timeZone: "Europe/Dublin" });

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
        {isDinner
          ? (lang === "zh" ? "晚餐：六人选一家" : "Dinner: pick one for six")
          : dingleTownDay
          ? (lang === "zh" ? "午餐：在外吃或 Airbnb 自煮" : "Lunch: eat out or cook at Airbnb")
          : (lang === "zh" ? "午餐：七人选一家" : "Lunch: pick one for seven")}
      </h3>
      <p className="mt-1 text-[14px] leading-snug text-sub">
        {isDinner
          ? (lang === "zh"
            ? "酒店内两家餐厅可直接步行，其他选项须打车去 Swords。七人旅程后今晚六人吃晚餐，先确认周四营业并订位；选择只存在这部手机。"
            : "Two choices are inside the hotel; the others require a taxi to Swords. Dinner is for six after dropping Rong off. Check Thursday hours and book ahead; your choice stays on this phone.")
          : dingleTownDay
          ? (lang === "zh"
            ? "可选餐厅或留在 Airbnb 自煮。周一餐厅可能提早关门，先确认营业与七人订位；市中心从住处步行可达。选择只存在这部手机。"
            : "Choose a Dingle restaurant or cook at the Airbnb. Check Monday hours and book for seven if eating out. Town is walkable from home; your choice stays on this phone.")
          : longTransferDay
          ? (lang === "zh"
            ? "邓多克送容之前，在 Portlaoise 选一家午餐；建议 45–60 分钟，餐厅停车后再步行入内。七人请提前确认周四营业及座位；选择存在本机。"
            : "Choose one lunch stop around Portlaoise before driving to Dundalk. Allow 45–60 minutes and drive to your selected venue; book for seven and confirm Thursday opening. Saved on this phone.")
          : roadTrip
          ? (lang === "zh"
            ? "选一家，先确认周日营业与七人订位。餐厅遍布不同小镇，需开车前往；选择只存在这部手机。"
            : "Pick one and confirm Sunday opening and a table for seven. These are in different towns, so drive to your chosen restaurant. Saved on this phone only.")
          : (lang === "zh"
            ? `选一家，先确认${dayOfWeekZh}营业与七人订位。选择只储存在这部手机；点地图可查看餐厅，再选「路线」步行前往。`
            : `Choose one, then check ${dayOfWeek} hours and reserve for seven. Your choice stays on this phone only; tap Map to open the listing, then Directions to walk there.`)}
      </p>
      <div className="mt-3 space-y-2">
        {options.map((o) => {
          const selected = choice === o.name;
          const maps = googleMapsSearchUrl(o.query);
          return (
            <div key={o.name} className={`flex items-center gap-2 rounded-2xl border p-2.5 ${selected ? "border-shamrock bg-shamrock-soft" : "border-line bg-cream"}`}>
              <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <input type="radio" name={`${meal}-${date}`} checked={selected} onChange={() => select(o.name)} className="size-5 shrink-0 accent-shamrock" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-snug">{o.name} {selected && <Check size={15} className="inline text-shamrock" />}</span>
                  <span className="block text-[13px] leading-snug text-sub">{p(o.food)}</span>
                </span>
              </label>
              {!o.name.startsWith("Airbnb lunch") && (
              <a href={maps} target="_blank" rel="noopener noreferrer" aria-label={lang === "zh" ? `在 Google 地图查看 ${o.name}` : `View ${o.name} on Google Maps`} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-shamrock px-2.5 text-[13px] font-semibold text-shamrock">
                <MapPin size={16} />
                {lang === "zh" ? "导航" : "Map"}
              </a>
              )}
            </div>
          );
        })}
      </div>
      {choice && <div className="mt-3 rounded-xl bg-shamrock-soft p-3 text-[14px] font-semibold text-shamrock"><Check size={16} className="mr-1 inline" />{lang === "zh" ? `已选：${choice}` : `Your ${meal} pick: ${choice}`}</div>}
    </Card>
  );
}
