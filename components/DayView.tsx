"use client";

import { BedDouble, Car, CloudSun, Sunset, TriangleAlert, Wallet } from "lucide-react";
import { places, stayById, stayNavUrl, navUrl, type Day } from "@/lib/trip";
import { sunHHMM } from "@/lib/sun";
import { weatherIcon, type Weather } from "@/lib/weather";
import { Card, CallButton, NavButton, fmtDate, useApp } from "./common";

function Tile({ icon, label, value, wide }: { icon: React.ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 rounded-2xl bg-cream px-3 py-2.5 ${wide ? "col-span-2" : ""}`}>
      <span className="text-shamrock">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13px] text-sub">{label}</div>
        <div className="text-[15px] font-semibold leading-snug">{value}</div>
      </div>
    </div>
  );
}

export default function DayView({ day, weather }: { day: Day; weather: Weather }) {
  const { lang, t, p } = useApp();
  const stay = stayById(day.stay);
  const abroad = day.n === 0 || day.n === 14;
  const tz = abroad ? "Asia/Kuala_Lumpur" : "Europe/Dublin";
  const sun = sunHHMM(day.date, day.sunAt[0], day.sunAt[1], tz);
  const label = day.n === 0 ? t("dayZero") : day.n === 14 ? t("dayHome") : t("day", { n: day.n });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl text-white shadow-lg" style={{ background: day.color }}>
        <div className="bg-gradient-to-br from-white/10 to-black/20 p-5">
          <div className="flex items-baseline justify-between gap-3 text-[15px] font-semibold opacity-90">
            <span>{label}</span>
            <span>{fmtDate(day.date, lang)}</span>
          </div>
          <h2 className="mt-2 text-[26px] font-bold leading-tight">{p(day.title)}</h2>
          <p className="mt-1.5 text-[16px] opacity-90">{p(day.route)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {day.drive && <Tile wide icon={<Car size={20} />} label={t("drive")} value={p(day.drive)} />}
        {!abroad && <Tile icon={<Wallet size={20} />} label={t("money")} value={day.currency === "GBP" ? "£ GBP 英镑" : "€ EUR 欧元"} />}
        {sun && <Tile icon={<Sunset size={20} />} label={t("sunset")} value={`${sun.set}`} />}
        <Tile
          wide={abroad}
          icon={<CloudSun size={20} />}
          label={t("weather")}
          value={weather ? `${weatherIcon(weather.code)} ${weather.min}–${weather.max}°C · ☔ ${weather.rain}%` : "—"}
        />
      </div>

      {stay && (
        <Card>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-sub">
            <BedDouble size={18} /> {t("tonight")}
          </div>
          <div className="mt-1 text-[20px] font-bold leading-snug">{p(stay.town)}</div>
          <div className="text-[15px] text-sub">{stay.name}</div>
          <div className="mt-1 text-[15px]">{stay.address}</div>
          <div className="mt-2 flex gap-4 text-[15px]">
            <span>
              {t("checkIn")} <b>{stay.checkIn}</b>
            </span>
            <span>
              {t("checkOut")} <b>{stay.checkOut}</b>
            </span>
          </div>
          {stay.warning && (
            <div className="mt-3 flex gap-2 rounded-2xl bg-warn-soft p-3 text-[15px] text-warn">
              <TriangleAlert size={20} className="mt-0.5 shrink-0" />
              <span>{p(stay.warning)}</span>
            </div>
          )}
          {stay.contact && <div className="mt-2 text-[14px] text-sub">{p(stay.contact)}</div>}
          <div className="mt-3 flex gap-2">
            <NavButton big href={stayNavUrl(stay)} label={t("navigate")} />
            {stay.phone && <CallButton big phone={stay.phone} label={t("call")} />}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-2 text-[18px] font-bold">{t("plan")}</h3>
        <ol className="relative">
          {day.steps.map((s, i) => {
            const pl = s.place ? places[s.place] : undefined;
            return (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="flex w-14 shrink-0 flex-col items-center">
                  <span className="rounded-full px-2 py-0.5 text-[13px] font-bold text-white" style={{ background: day.color }}>
                    {s.t === "eve" ? t("eve") : s.t}
                  </span>
                  {i < day.steps.length - 1 && <span className="mt-1 w-0.5 flex-1 bg-line" />}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[16px] leading-snug">{p(s.text)}</p>
                  {s.cost && <p className="mt-1 text-[14px] font-medium text-amber">💶 {p(s.cost)}</p>}
                  {pl && (
                    <a
                      href={navUrl(pl.lat, pl.lng, pl.q)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-shamrock-soft px-3 py-1 text-[14px] font-semibold text-shamrock"
                    >
                      📍 {p(pl)} →
                    </a>
                  )}
                  {s.link && (
                    <a
                      href={s.link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-shamrock-soft px-3 py-1 text-[14px] font-semibold text-shamrock"
                    >
                      📍 {p(s.link.label)} →
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {day.tips.length > 0 && (
        <Card className="bg-[#fffaf0]">
          <h3 className="mb-2 text-[18px] font-bold">💡 {t("tips")}</h3>
          <ul className="space-y-2">
            {day.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-[16px] leading-snug">
                <span className="text-amber">•</span>
                <span>{p(tip)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
