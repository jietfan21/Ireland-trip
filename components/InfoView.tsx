"use client";

import { BedDouble, Car, Phone, Plane, TriangleAlert } from "lucide-react";
import { car, emergency, flights, people, stays, stayNavUrl } from "@/lib/trip";
import { daysBetween, fmtDate, Avatar, Card, CallButton, NavButton, useApp } from "./common";
import { useViewState } from "./ViewMemory";
import { orderedFlights } from "@/lib/flights";

type Seg = "stays" | "flights" | "car" | "sos";

export default function InfoView() {
  const { t } = useApp();
  const [seg, setSeg] = useViewState<Seg>("info.section", "stays");
  const segs: { id: Seg; icon: React.ReactNode }[] = [
    { id: "stays", icon: <BedDouble size={18} /> },
    { id: "flights", icon: <Plane size={18} /> },
    { id: "car", icon: <Car size={18} /> },
    { id: "sos", icon: <Phone size={18} /> },
  ];
  return (
    <div className="space-y-4">
      <div className="info-tabs grid grid-cols-4 gap-1 rounded-2xl border border-line bg-card p-1">
        {segs.map((s) => (
          <button
            key={s.id}
            onClick={() => { if (seg !== s.id) { setSeg(s.id); window.scrollTo({ top: 0, behavior: "instant" }); } }}
            aria-pressed={seg === s.id}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[14px] font-bold ${seg === s.id ? "bg-shamrock text-white" : "text-sub"}`}
          >
            {s.icon}
            {t(s.id)}
          </button>
        ))}
      </div>
      {seg === "stays" && <Stays />}
      {seg === "flights" && <Flights />}
      {seg === "car" && <CarInfo />}
      {seg === "sos" && <Sos />}
    </div>
  );
}

function Stays() {
  const { lang, t, p } = useApp();
  return (
    <div className="space-y-3">
      {stays.map((s, i) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-sub">
                {i + 1} · {fmtDate(s.from, lang)} → {fmtDate(s.to, lang)} · {t("nights", { n: daysBetween(s.from, s.to) })}
              </div>
              <div className="mt-0.5 text-[20px] font-bold leading-snug">{p(s.town)}</div>
              <div className="text-[15px] text-sub">{s.name}</div>
            </div>
          </div>
          <div className="mt-2 text-[15px]">{s.address}</div>
          <div className="mt-1 flex gap-4 text-[15px]">
            <span>
              {t("checkIn")} <b>{s.checkIn}</b>
            </span>
            <span>
              {t("checkOut")} <b>{s.checkOut}</b>
            </span>
          </div>
          {s.warning && (
            <div className="mt-3 flex gap-2 rounded-2xl bg-warn-soft p-3 text-[15px] text-warn">
              <TriangleAlert size={20} className="mt-0.5 shrink-0" />
              <span>{p(s.warning)}</span>
            </div>
          )}
          <ul className="mt-2 space-y-1 text-[15px] leading-snug">
            {s.notes.map((n, j) => (
              <li key={j} className="flex gap-2">
                <span className="text-amber">•</span>
                <span>{p(n)}</span>
              </li>
            ))}
            {s.contact && (
              <li className="flex gap-2">
                <span className="text-amber">•</span>
                <span>{p(s.contact)}</span>
              </li>
            )}
            {s.approx && <li className="text-[14px] text-sub">📍 {t("approxPin")}</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <NavButton big href={stayNavUrl(s)} label={t("navigate")} />
            {s.phone && <CallButton big phone={s.phone} label={t("call")} />}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Flights() {
  const { p } = useApp();
  return (
    <div className="space-y-3">
      {orderedFlights().map((flight) => (
        <Card key={flight.code} className="flight-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 py-1" aria-label={flight.passengers.map(p).join(" · ")}>
              {flight.passengers.map((person) => <Avatar key={person.id} person={person} size={36} />)}
            </div>
            <span className="shrink-0 rounded-lg bg-ink px-2.5 py-1 text-[14px] font-bold text-white">{flight.code}</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[20px] font-bold">
            <span>{flight.from}</span><Plane size={20} className="shrink-0 text-shamrock" aria-hidden="true" /><span>{flight.to}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-[15px] tabular-nums text-sub">
            <span>🛫 {flight.dep}</span><span className="text-right">🛬 {flight.arr}</span>
          </div>
          {flight.note && <div className="mt-2 text-[14px] font-semibold text-warn">⚠️ {p(flight.note)}</div>}
          {flight.showGroup && <div className="mt-3 border-t border-line pt-3">
            <p className="text-[14px] font-semibold text-sub">{p(flight.title)}</p>
            {flight.groupNote && <p className="mt-1 text-[14px] text-sub">{p(flight.groupNote)}</p>}
          </div>}
        </Card>
      ))}
      <Card>
        <div className="flex items-center gap-3">
          <Avatar person={people.find((person) => person.id === "rong")!} size={36} />
          <div><p className="text-[16px] font-bold">{p(flights.local.title)}</p>{flights.local.note && <p className="text-[15px] text-sub">{p(flights.local.note)}</p>}</div>
        </div>
      </Card>
    </div>
  );
}

function CarInfo() {
  const { lang, t } = useApp();
  const zh = lang === "zh";
  const drivers = people.filter((x) => x.driver).map((x) => (zh ? x.zh : x.en)).join(" · ");
  const rows: [string, string][] = [
    [zh ? "车型" : "Car", zh ? "Ford Tourneo 9 人座 · 自动挡（或同级）" : car.model],
    [zh ? "公司" : "Company", car.company],
    [zh ? "取车" : "Pick-up", `${car.pickup.when} · ${car.pickup.where}`],
    [zh ? "还车" : "Return", `${car.dropoff.when} · ${car.dropoff.where}`],
    [zh ? "营业时间" : "Hours", car.hours],
    [zh ? "司机" : "Drivers", drivers],
  ];
  const remember = zh
    ? [
        "取车：T1 入境大厅出口 → 4 号区坐租车接驳巴士到 Eastlands",
        "一定要告诉柜台会开去北爱尔兰（要付跨境费），不然可能被罚",
        "每个司机都要带：驾照正本 + 国际驾照 + 护照（同一国家签发），年龄 30–80 岁，驾照满 13 年",
        "爸爸是主司机：要带实体芯片信用卡（不收借记卡、银联），押金约租金 + €250",
        "已买 Trip.com 全险：柜台推销保险可以拒绝；出事先自己付，回来再向 Trip.com 索赔",
        "取车和还车都拍照、录影：车身四周、油表、里程",
        "爱尔兰靠左行驶；北爱尔兰限速用英里",
      ]
    : [
        "Pick-up: T1 arrivals exit → Zone 4 car-rental shuttle to Eastlands",
        "Tell the counter you're driving to Northern Ireland (cross-border fee) — otherwise fines may apply",
        "Every driver brings: original licence + IDP + passport (same issuing country), age 30–80, licence held 13+ years",
        "Dad is main driver: physical chip credit card (no debit/UnionPay); deposit ≈ rental + €250",
        "Full cover bought via Trip.com: you can decline the counter's insurance; pay any damage first, claim from Trip.com later",
        "Photos & video at pick-up and return: all sides, fuel gauge, mileage",
        "Drive on the LEFT; Northern Ireland signs are in mph",
      ];
  return (
    <div className="space-y-3">
      <Card>
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-3 py-2.5">
              <dt className="w-20 shrink-0 text-[15px] text-sub">{k}</dt>
              <dd className="text-[15px] font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex gap-2">
          <CallButton big phone={car.phone} label={`Alamo ${t("call")}`} />
        </div>
      </Card>
      <Card className="bg-[#fffaf0]">
        <h3 className="mb-2 text-[18px] font-bold">🚐 {zh ? "租车必看" : "Must know"}</h3>
        <ul className="space-y-2">
          {remember.map((r) => (
            <li key={r} className="flex gap-2 text-[16px] leading-snug">
              <span className="text-amber">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Sos() {
  const { p, t, lang } = useApp();
  return (
    <div className="space-y-3">
      {emergency.map((e) => (
        <Card key={e.phone}>
          <div className="text-[17px] font-bold">{p(e.label)}</div>
          <div className="mt-1 text-[28px] font-bold tracking-wide">{e.phone}</div>
          <div className="mt-2 flex">
            <CallButton big phone={e.phone} label={t("call")} />
          </div>
        </Card>
      ))}
      <Card>
        <div className="text-[17px] font-bold">{lang === "zh" ? "马来西亚驻爱尔兰大使馆" : "Embassy of Malaysia, Dublin"}</div>
        <div className="mt-3 flex">
          <NavButton href="https://www.google.com/maps/search/?api=1&query=Embassy+of+Malaysia+Dublin" label={t("open")} />
        </div>
      </Card>
      <p className="px-1 text-[15px] text-sub">
        {lang === "zh" ? "爱尔兰和北爱尔兰都可以打 112 或 999。" : "112 and 999 both work in Ireland and Northern Ireland."}
      </p>
    </div>
  );
}

