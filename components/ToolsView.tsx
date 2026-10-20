"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { checklist, people } from "@/lib/trip";
import { readLocal, sharedEnabled, useTicks, writeLocal } from "@/lib/store";
import { Avatar, Card, useApp } from "./common";
import { useViewState } from "./ViewMemory";

const CODES = ["EUR", "GBP", "MYR", "AUD"] as const;
type Code = (typeof CODES)[number];
const SYMBOL: Record<Code, string> = { EUR: "€", GBP: "£", MYR: "RM", AUD: "A$" };
const NAME: Record<Code, { zh: string; en: string }> = {
  EUR: { zh: "欧元", en: "Euro" },
  GBP: { zh: "英镑", en: "Pound" },
  MYR: { zh: "令吉", en: "Ringgit" },
  AUD: { zh: "澳元", en: "Aus dollar" },
};
// Offline fallback, per 1 EUR (approximate).
const FALLBACK: Record<Code, number> = { EUR: 1, GBP: 0.86, MYR: 4.6, AUD: 1.75 };
const RATES_KEY = "ie.rates";

function useRates() {
  const [rates, setRates] = useState<{ r: Record<Code, number>; date?: string }>({ r: FALLBACK });
  useEffect(() => {
    const cached = readLocal<{ r: Record<Code, number>; date?: string } | null>(RATES_KEY, null);
    if (cached) setRates(cached);
    fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP,MYR,AUD")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.rates?.GBP) return;
        const next = { r: { EUR: 1, GBP: j.rates.GBP, MYR: j.rates.MYR, AUD: j.rates.AUD }, date: j.date as string };
        setRates(next);
        writeLocal(RATES_KEY, next);
      })
      .catch(() => {});
  }, []);
  return rates;
}

function Currency() {
  const { t, lang } = useApp();
  const { r, date } = useRates();
  const [from, setFrom] = useViewState<Code>("currency.from", "EUR");
  const [amount, setAmount] = useViewState("currency.amount", "10");
  const n = Number(amount.replace(",", ".")) || 0;
  const fmt = (v: number) => v.toLocaleString("en", { maximumFractionDigits: v < 100 ? 2 : 0 });

  return (
    <Card>
      <h3 className="text-[18px] font-bold">💱 {t("currency")}</h3>
      <p className="text-[13px] text-sub">{date ? `${t("rateLive")} · ${date}` : t("rateOffline")}</p>
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-cream p-1">
        {CODES.map((c) => (
          <button
            key={c}
            onClick={() => setFrom(c)}
            aria-pressed={from === c}
            className={`min-h-11 rounded-xl py-2 text-[15px] font-bold ${from === c ? "bg-shamrock text-white" : "text-sub"}`}
          >
            {SYMBOL[c]}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-shamrock bg-white px-4">
        <span className="text-[22px] font-bold text-shamrock">{SYMBOL[from]}</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 text-[28px] font-bold outline-none"
          aria-label="amount"
        />
      </label>
      <div className="mt-2 flex gap-2">
        {[5, 10, 20, 50, 100].map((v) => (
          <button key={v} onClick={() => setAmount(String(v))} className="min-h-11 flex-1 rounded-xl border border-line py-1.5 text-[15px] font-semibold">
            {v}
          </button>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-line">
        {CODES.filter((c) => c !== from).map((c) => (
          <li key={c} className="flex items-baseline justify-between py-2.5">
            <span className="text-[16px] text-sub">{NAME[c][lang]}</span>
            <span className="text-[24px] font-bold">
              {SYMBOL[c]} {fmt((n / r[from]) * r[c])}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Checklist() {
  const { t, p, person } = useApp();
  const { ticks, toggle } = useTicks();
  const [sections, setSections] = useViewState<Record<string, boolean>>("checklist.sections", {});
  if (!person) return null;

  return (
    <div className="space-y-3">
      <p className="px-1 text-[14px] text-sub">{sharedEnabled ? `✅ ${t("synced")}` : `📱 ${t("localOnly")}`}</p>
      {checklist.map((sec, index) => (
        <Card key={sec.title.en}>
          <details className="checklist-section" open={sections[sec.title.en] ?? index === 0} onToggle={(e) => {
            const open = e.currentTarget.open;
            setSections((current) => (current[sec.title.en] ?? index === 0) === open ? current : { ...current, [sec.title.en]: open });
          }}>
          <summary className="-mx-1 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-1">
            <h3 className="text-[18px] font-bold">{p(sec.title)}</h3><ChevronDown className="checklist-chevron shrink-0 text-sub" size={20} aria-hidden="true" />
          </summary>
          <ul>
            {sec.items
              .filter((it) => it.who !== "drivers" || person.driver)
              .map((it) => {
                const key = `${it.id}:${it.who === "team" ? "team" : person.id}`;
                const done = !!ticks[key];
                const crew = it.who === "team" ? [] : people.filter((x) => (it.who !== "drivers" || x.driver) && ticks[`${it.id}:${x.id}`]);
                return (
                  <li key={it.id} className="border-b border-line py-1 last:border-0">
                    <button onClick={() => toggle(key, person.id)} aria-pressed={done} className="checklist-item flex min-h-11 w-full items-center gap-3 rounded-xl py-2 text-left">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 ${
                          done ? "border-shamrock bg-shamrock text-white" : "border-line bg-white"
                        }`}
                      >
                        {done && <Check size={18} strokeWidth={3} />}
                      </span>
                      <span className={`text-[16px] leading-snug ${done ? "text-sub line-through" : ""}`}>{p(it.text)}</span>
                    </button>
                    {crew.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 pl-10">
                        {crew.map((c) => (
                          <Avatar key={c.id} person={c} size={22} />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
          </details>
        </Card>
      ))}
    </div>
  );
}

export default function ToolsView() {
  return (
    <div className="space-y-4">
      <Checklist />
      <Currency />
    </div>
  );
}

