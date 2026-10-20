"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { people, type Person } from "@/lib/trip";
import {
  DAYS,
  MAX_SHIELDS,
  WEDGES,
  coinValue,
  dayMultiplier,
  eventText,
  mirrorPrice,
  leaderboard,
  nextDublinMidnightMs,
  pickWedge,
  todayOverride,
  tripDayNumber,
  victims,
  visibleEvents,
  type Event,
  type PlayerRow,
} from "@/lib/pirate";
import { irelandToday, usePirate, type SpinResult } from "@/lib/pirateStore";
import { Avatar, Card, useApp } from "./common";

const WHEEL_MS = 3400;
const ids = people.map((p) => p.id);
const who = (id: string) => people.find((p) => p.id === id) as Person;

type Phase = "idle" | "spinning" | "pick" | "landed";
type Board = ReturnType<typeof leaderboard>;
type Snapshot = { mine: PlayerRow | null; board: Board; events: Event[] };

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const two = (n: number) => String(n).padStart(2, "0");
  return `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
}

export default function PirateSheet({ onClose }: { onClose: () => void }) {
  const { t, p, person } = useApp();
  const me = person?.id ?? null;
  const [today, setToday] = useState(() => todayOverride(location.search, location.hostname) ?? irelandToday());
  const game = usePirate(me, today);
  const [phase, setPhase] = useState<Phase>("idle");
  const [wedge, setWedge] = useState<{ index: number; n: number } | null>(null); // where the wheel stops; n re-triggers the spin
  const [caption, setCaption] = useState<{ text: string; good: boolean } | null>(null);
  const [countdown, setCountdown] = useState("");
  const [frozen, setFrozen] = useState<Snapshot | null>(null); // what the cards show while the wheel turns
  const [busy, setBusy] = useState(false);
  const spins = useRef(0);

  useEffect(() => {
    const tick = () => {
      setToday(todayOverride(location.search, location.hostname) ?? irelandToday());
      setCountdown(fmtCountdown(nextDublinMidnightMs(new Date()) - Date.now()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const liveBoard = useMemo(() => leaderboard(ids, game.rows, game.dbSeason), [game.rows, game.dbSeason]);
  const liveEvents = useMemo(() => visibleEvents(game.events, ids, me), [game.events, me]);
  const view: Snapshot = phase === "spinning" && frozen ? frozen : { mine: game.mine, board: liveBoard, events: liveEvents };
  const { mine, board, events } = view;
  const left = mine?.spins ?? 0;
  const contested = board.some((x) => x.gold !== board[0].gold); // no crown while everyone is tied
  const targets = useMemo(() => (me ? victims(me, ids, game.rows, game.dbSeason, today) : []), [me, game.rows, game.dbSeason, today]);
  const price = mirrorPrice(mine?.gold ?? 0);
  const name = (id: string) => {
    const x = people.find((q) => q.id === id);
    return x ? p(x) : id;
  };
  const loading = !game.ready || (game.online && game.season !== "over" && !game.mine);
  const season = game.season;
  const seasonLabel = season === "practice" ? t("practiceBanner") : season === "trip" ? t("dayOf", { n: tripDayNumber(today) }) : t("gameOver");

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const land = (res: SpinResult, index: number) => {
    const w = WEDGES[index];
    if (!res.applied) {
      // The wheel already turned; say why it didn't count instead of going quiet.
      setCaption({ text: res.reason === "no spins" ? t("cap_noSpins") : t("cap_noSignal"), good: false });
      setPhase("landed");
      return;
    }
    const v = res.victim ? name(res.victim) : "";
    let text = "";
    let good = true;
    if (w.kind === "win") text = t("cap_coins", { n: res.amount || w.amount || 0 });
    else if (w.kind === "spins") text = t("cap_spins");
    else if (w.kind === "shield") text = res.amount === 100 ? t("cap_shieldFull") : t("cap_shield");
    else if (w.kind === "steal") {
      if (res.outcome === "hit") text = t("cap_stealHit", { who: v, n: res.amount });
      else if (res.outcome === "blocked") (text = t("cap_stealBlocked", { who: v })), (good = false);
      else if (res.outcome === "reflected") (text = t("cap_stealReflected", { who: v, n: res.amount })), (good = false);
      else (text = t("cap_stealNone")), (good = false);
    } else if (w.kind === "boom") {
      if (res.outcome === "hit") text = t("cap_boomHit", { who: v, n: res.amount });
      else if (res.outcome === "blocked") (text = t("cap_boomBlocked", { who: v })), (good = false);
      else if (res.outcome === "reflected") (text = t("cap_boomReflected", { who: v, n: res.amount })), (good = false);
      else (text = t("cap_boomNone")), (good = false);
    }
    setCaption({ text, good });
    setPhase("landed");
  };

  const spin = async () => {
    if (!me || left <= 0 || busy) return;
    const index = pickWedge(Math.random);
    const w = WEDGES[index];
    setBusy(true);
    setFrozen({ mine: game.mine, board: liveBoard, events: liveEvents });
    setCaption(null);
    setWedge({ index, n: ++spins.current });
    setPhase("spinning");
    try {
      if (w.kind === "boom") {
        // The spin is used now (server marks the boom pending); the victim comes next.
        const [res] = await Promise.all([game.spin("boom"), wait(WHEEL_MS + 200)]);
        if (res.applied) setPhase("pick");
        else land(res, index);
      } else {
        const [res] = await Promise.all([game.spin(w.kind, w.amount), wait(WHEEL_MS + 200)]);
        land(res, index);
      }
    } finally {
      setBusy(false);
    }
  };

  const BOOM_INDEX = WEDGES.findIndex((w) => w.kind === "boom");
  const boom = async (victim: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await game.boomPick(victim);
      if (!res.applied && res.reason === "no boom pending") setPhase("idle");
      else land(res, wedge?.index ?? BOOM_INDEX);
    } finally {
      setBusy(false);
    }
  };

  // A bomb spun earlier (app closed mid-pick, or another phone): straight to the victim pick.
  useEffect(() => {
    if (game.mine?.boom_pending && phase === "idle") setPhase("pick");
  }, [game.mine?.boom_pending, phase]);

  const exchange = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await game.exchange();
    } finally {
      setBusy(false);
    }
  };
  const buy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await game.buyMirror();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream pt-safe" data-online={String(game.online)} data-ready={String(game.ready)}>
      <div className="mx-auto w-full max-w-md px-4 pb-16">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 bg-cream/95 px-4 py-3 backdrop-blur">
          <div>
            <h1 className="text-[22px] font-bold leading-tight">🏴‍☠️ {t("pirate")}</h1>
            <p className="text-[13px] text-sub">{season === "trip" ? `${seasonLabel} · ${today}` : seasonLabel}</p>
          </div>
          <button onClick={onClose} aria-label="close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card">
            <X />
          </button>
        </div>

        {!game.online && game.ready ? (
          <Card className="mt-3 text-center text-[16px] text-sub">📡 {t("needsSignal")}</Card>
        ) : loading ? (
          <Card className="mt-3 py-10 text-center text-4xl">
            <span className="pirate-roll inline-block">🏴‍☠️</span>
          </Card>
        ) : season === "over" ? (
          <Card className="mt-3 text-center">
            <div className="text-5xl">👑</div>
            <div className="mt-2 text-[22px] font-bold">{t("gameOver")}</div>
            <div className="mt-1 text-[16px] text-sub">
              {t("king")}: {board.filter((x) => x.leader).map((x) => name(x.id)).join(" & ")}
            </div>
          </Card>
        ) : (
          person && (
            <>
              <Card className="mt-3">
                <div className="flex items-center gap-3">
                  <Avatar person={person} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] text-sub">{p(person)}</div>
                    <div className="text-[30px] font-bold leading-tight">
                      {(mine?.gold ?? 1000).toLocaleString()} <span className="text-[18px]">🪙</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] text-sub">{t("spinsLeft", { n: left })}</div>
                    <div className="text-[26px] font-bold leading-tight">🎰 {left}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-cream px-3 py-2">
                  <div className="text-[15px]">
                    <span className="text-sub">{t("yourShields")}</span>{" "}
                    <span className="font-semibold">
                      {"🛡️".repeat(mine?.shields ?? 0) || "—"}
                      {mine?.mirror && " 🪞"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={exchange}
                      disabled={busy || !mine || mine.shields < 2 || mine.mirror}
                      className="whitespace-nowrap rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-bold disabled:opacity-40"
                    >
                      {t("exchange")}
                    </button>
                    <button
                      onClick={buy}
                      disabled={busy || !mine || mine.mirror || mine.gold < price}
                      className="whitespace-nowrap rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-bold disabled:opacity-40"
                    >
                      {t("buyMirror", { n: price.toLocaleString() })}
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="mt-3 min-h-[200px] text-center">
                {(phase === "spinning" || phase === "landed") && (
                  <Wheel key={wedge?.n ?? -1} target={wedge?.index ?? BOOM_INDEX} settled={phase === "landed"} today={today} />
                )}

                {phase === "pick" && (
                  <div>
                    <div className="text-[18px] font-bold">💣 {t("pickBoom")}</div>
                    {targets.every((v) => v.boomedToday) && (
                      <button onClick={() => boom(null)} disabled={busy} className="mt-3 w-full rounded-3xl border border-line bg-cream py-3 text-[16px] font-bold">
                        {t("cap_boomNone")}
                      </button>
                    )}
                    <ul className="mt-3 space-y-2 text-left">
                      {targets.map((v) => (
                        <li key={v.id}>
                          <button
                            disabled={busy || v.boomedToday}
                            onClick={() => boom(v.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-cream px-3 py-2 active:scale-[.98] disabled:opacity-40"
                          >
                            <Avatar person={who(v.id)} size={36} />
                            <span className="flex-1 text-[16px] font-semibold">{name(v.id)}</span>
                            <span className="text-[14px] text-sub">{v.boomedToday ? `💣 ${t("boomedToday")}` : `${v.gold.toLocaleString()} 🪙`}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {phase === "landed" && caption && (
                  <div className="py-2">
                    <div className={`pirate-land mt-2 text-[18px] font-bold ${caption.good ? "" : "text-warn"}`}>{caption.text}</div>
                    {caption.good && wedge && WEDGES[wedge.index].kind !== "shield" && <Burst />}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {left > 0 ? (
                        <button onClick={spin} disabled={busy} className="rounded-3xl bg-ink py-4 text-[18px] font-bold text-white active:scale-[.98] disabled:opacity-50">
                          🎡 {t("spinAgain")}
                        </button>
                      ) : (
                        <button onClick={() => setPhase("idle")} className="rounded-3xl bg-ink py-4 text-[18px] font-bold text-white active:scale-[.98]">
                          OK
                        </button>
                      )}
                      <button onClick={() => setPhase("idle")} className="rounded-3xl border border-line bg-cream py-4 text-[18px] font-bold active:scale-[.98]">
                        {t("later")}
                      </button>
                    </div>
                  </div>
                )}

                {phase === "idle" && (
                  <div className="py-2">
                    {left > 0 ? (
                      <>
                        <Wheel target={0} settled preview today={today} />
                        {dayMultiplier(today) > 1 && (
                          <div className="mt-1 text-[13px] text-sub">{t("prizesToday", { m: dayMultiplier(today).toFixed(1) })}</div>
                        )}
                        <button
                          onClick={spin}
                          disabled={busy}
                          className="pirate-pulse mt-3 w-full rounded-3xl bg-ink py-5 text-[24px] font-bold text-white active:scale-[.98] disabled:opacity-50"
                        >
                          🎡 {t("spin")}
                        </button>
                      </>
                    ) : (
                      <div>
                        <div className="text-4xl">😴</div>
                        <div className="mt-2 text-[17px] font-semibold">{t("noSpins")}</div>
                        <div className="mt-3 text-[13px] uppercase tracking-wider text-sub">{t("nextDayIn")}</div>
                        <div className="font-mono text-[44px] font-bold leading-none tabular-nums text-ink">{countdown}</div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </>
          )
        )}

        <h2 className="mt-5 px-1 text-[18px] font-bold">🏆 {t("leaderboard")}</h2>
        <Card className="mt-2 p-2">
          <ul>
            {board.map((x, i) => (
              <li key={x.id} className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${x.id === me ? "bg-shamrock-soft" : ""}`}>
                <span className="w-5 text-center text-[15px] font-bold text-sub">{i + 1}</span>
                <Avatar person={who(x.id)} size={36} />
                <span className="flex-1 text-[16px] font-semibold">
                  {name(x.id)} {x.leader && contested && "👑"}
                </span>
                <span className="text-[16px] font-bold">{x.gold.toLocaleString()} 🪙</span>
              </li>
            ))}
          </ul>
        </Card>

        <h2 className="mt-5 px-1 text-[18px] font-bold">📣 {t("feed")}</h2>
        <Card className="mt-2">
          {events.length === 0 ? (
            <p className="text-[15px] text-sub">—</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex gap-2 text-[15px]">
                  <span className="shrink-0 text-[13px] text-sub">{e.day.slice(5).replace("-", "/")}</span>
                  <span>{p(eventText(e, name))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <details className="mt-5 rounded-3xl border border-line bg-card p-4">
          <summary className="cursor-pointer text-[18px] font-bold">📜 {t("howToPlay")}</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
            {RULES.map((r, i) => (
              <li key={i}>{p(r)}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}

// Lucky-draw wheel: ten equal wedges; spins 5 turns and eases to a stop with the target under the pointer.
function Wheel({ target, settled = false, preview = false, today }: { target: number; settled?: boolean; preview?: boolean; today: string }) {
  const { p } = useApp();
  const SIZE = preview ? 200 : 280;
  const R = SIZE / 2;
  const step = 360 / WEDGES.length;
  const mid = target * step + step / 2;
  const finalDeg = preview ? 0 : 5 * 360 + (360 - mid);
  const [deg, setDeg] = useState(settled || preview ? finalDeg : 0);
  useEffect(() => {
    if (settled || preview) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setDeg(finalDeg);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDeg(finalDeg)));
    return () => cancelAnimationFrame(id);
  }, [settled, preview, finalDeg]);
  const pt = (a: number, r: number) => [R + r * Math.sin((a * Math.PI) / 180), R - r * Math.cos((a * Math.PI) / 180)];
  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{
          transform: `rotate(${deg}deg)`,
          transition: settled || preview || deg === 0 ? "none" : `transform ${WHEEL_MS}ms cubic-bezier(0.12, 0.75, 0.15, 1)`,
          willChange: "transform",
        }}
      >
        {WEDGES.map((w, i) => {
          const start = i * step, end = start + step, m = start + step / 2;
          const [x1, y1] = pt(start, R - 4);
          const [x2, y2] = pt(end, R - 4);
          const [ex, ey] = pt(m, R * 0.56);
          const [lx, ly] = pt(m, R * 0.82);
          return (
            <g key={i}>
              <path d={`M${R} ${R} L${x1} ${y1} A${R - 4} ${R - 4} 0 0 1 ${x2} ${y2} Z`} fill={w.color} stroke="#f5f2ea" strokeWidth="3" />
              <text x={ex} y={ey} textAnchor="middle" dominantBaseline="central" fontSize={preview ? 18 : 26} transform={`rotate(${m} ${ex} ${ey})`}>
                {w.emoji}
              </text>
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={preview ? 9 : 12}
                fontWeight="700"
                fill="#fff"
                transform={`rotate(${m} ${lx} ${ly})`}
              >
                {w.kind === "win" ? coinValue(w.amount ?? 0, today).toLocaleString() : p(w.label)}
              </text>
            </g>
          );
        })}
        <circle cx={R} cy={R} r={R - 2} fill="none" stroke="#c7782b" strokeWidth="6" />
        <circle cx={R} cy={R} r={preview ? 16 : 22} fill="#f5f2ea" stroke="#c7782b" strokeWidth="4" />
        <text x={R} y={R} textAnchor="middle" dominantBaseline="central" fontSize={preview ? 14 : 20}>
          ☘️
        </text>
      </svg>
      {!preview && <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-[34px] leading-none drop-shadow">🔻</div>}
    </div>
  );
}

function Burst() {
  return (
    <span className="pointer-events-none relative block h-0">
      {[-40, -15, 10, 35].map((dx, i) => (
        <span key={i} className="crew-burst absolute left-1/2 -top-16 text-2xl" style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${-30 - i * 8}px` }}>
          🪙
        </span>
      ))}
    </span>
  );
}

const RULES = [
  { zh: "大家从 1,000 金币开始。每天早上（爱尔兰时间）多 5 次转盘，没用完的会留着。", en: "Everyone starts with 1,000 gold. Every Irish morning you get 5 more spins; unused ones carry over." },
  { zh: "转盘 10 格，每格机会一样：💰 50 / 100 / 150 / 200 / 300 / 500 直接进口袋，而且奖金每天变大（第 14 天 ×3）。", en: "Ten equal wedges: 💰 50 / 100 / 150 / 200 / 300 / 500 go straight into your gold, and prizes grow every day (×3 on Day 14)." },
  { zh: "🏴‍☠️ 偷：随机偷一个人 15% 的金币（最后一名偷不到）。💣 炸：你选一个人，他损失 20%（炸掉，不归你）；每人每天只能被炸一次。", en: "🏴‍☠️ Steal takes 15% from a random person (never the one in last place). 💣 Boom: you pick someone, they lose 20% (destroyed, not yours); each person can only be boomed once a day." },
  { zh: `🛡️ 盾牌：挡一次攻击，最多 ${MAX_SHIELDS} 块，别人看不到你有几块。🎰 多 3 次转盘。`, en: `🛡️ Shield blocks one attack, up to ${MAX_SHIELDS}, hidden from others. 🎰 gives +3 spins.` },
  { zh: "🪞 镜子（最多一面）：挡下攻击，并把同样的伤害反弹给攻击者。两块盾牌悄悄换一面，或花 20% 金币买一面（大家都会看到）。", en: "🪞 Mirror (max one): blocks the attack and sends the same hit back. Trade two shields for one quietly, or buy one for 20% of your gold (everyone sees that)." },
  { zh: `10月25日第 1 天大家重新从 1,000 开始，第 ${DAYS} 天（11月7日）结束，最多的人是海盗王 👑`, en: `Day 1 (25 Oct) everyone restarts at 1,000; after Day ${DAYS} (7 Nov) the richest is Pirate King 👑` },
];
