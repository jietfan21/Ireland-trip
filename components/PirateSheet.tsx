"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, HelpCircle, Shield, Trophy, Volume2, VolumeX, X, Swords } from "lucide-react";
import "./pirate-game.css";
import { people, type Person } from "@/lib/trip";
import { DAYS, MAX_SHIELDS, WEDGES, dayMultiplier, mirrorPrice, leaderboard, nextDublinMidnightMs, pickWedge, todayOverride, tripDayNumber, victims, visibleEvents, type Event, type PlayerRow } from "@/lib/pirate";
import { mirrorOrderChanged, nextWheelRotation, stealCandidates, type MirrorOrder } from "@/lib/piratePresentation";
import { irelandToday, usePirate, type SpinResult } from "@/lib/pirateStore";
import { readLocal, writeLocal } from "@/lib/store";
import { Avatar, useApp } from "./common";
import PirateWheel, { StealWheel } from "./PirateWheel";
import { AnimatedGold, CoinCollection } from "./PirateCoins";
import PirateEffects, { type PirateEffect } from "./PirateEffects";
import PirateCrew from "./PirateCrew";
import PirateDuel from "./PirateDuel";
import DuelTour from "./DuelTour";
import { useDuel } from "@/lib/duelStore";
import { tr, type Lang, type UiKey } from "@/lib/i18n";

type Phase = "idle" | "spinning" | "stealing" | "pick" | "impact" | "landed";
type Panel = "defend" | "crew" | "rules" | null;
type Snapshot = { mine: PlayerRow | null; board: ReturnType<typeof leaderboard>; events: Event[] };
type Caption = { text: string; good: boolean; icon: string };
const ids = people.map((p) => p.id);
const who = (id: string) => people.find((p) => p.id === id) as Person;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function countdown(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((n) => String(n).padStart(2, "0")).join(":");
}

function describeLanding(res: SpinResult, index: number, lang: Lang): Caption {
  const t = (key: UiKey, vars?: Record<string, string | number>) => tr(lang, key, vars);
  const name = (id: string) => { const person = people.find((p) => p.id === id); return person ? person[lang] : id; };
  const w = WEDGES[index];
  let text = "", good = true, icon = w.emoji;
  if (!res.applied) {
    text = res.reason === "no spins" ? t("cap_noSpins") : t("cap_noSignal");
    good = false; icon = "📡";
  } else if (w.kind === "win") text = t("cap_coins", { n: res.amount });
  else if (w.kind === "spins") text = t("cap_spins");
  else if (w.kind === "shield") text = res.amount === 100 ? t("cap_shieldFull") : t("cap_shield");
  else {
    const v = res.victim ? name(res.victim) : "";
    if (res.outcome === "blocked") {
      text = w.kind === "steal" ? t("cap_stealBlocked", { who: v }) : t("cap_boomBlocked", { who: v });
      good = false; icon = "🛡️";
    } else if (res.outcome === "reflected") {
      text = w.kind === "steal" ? t("cap_stealReflected", { who: v, n: res.amount }) : t("cap_boomReflected", { who: v, n: res.amount });
      good = false; icon = "🪞";
    } else if (res.outcome === "hit") text = w.kind === "steal" ? t("cap_stealHit", { who: v, n: res.amount }) : t("cap_boomHit", { who: v, n: res.amount });
    else { text = w.kind === "steal" ? t("cap_stealNone") : t("cap_boomNone"); good = false; icon = "🌊"; }
  }
  return { text, good, icon };
}

export default function PirateSheet({ onClose, onLang }: { onClose: () => void; onLang: () => void }) {
  const { lang, t, p, person } = useApp();
  const say = (zh: string, en: string) => lang === "zh" ? zh : en;
  const me = person?.id ?? null;
  const [today, setToday] = useState(() => todayOverride(location.search, location.hostname) ?? irelandToday());
  const game = usePirate(me, today);
  const duel = useDuel(me);
  const tourKey = `ie.duel.tour.v1.${me}`;
  const [screen, setScreen] = useState<"wheel" | "duel">(() => me && readLocal<boolean>(tourKey, false) !== true ? "duel" : "wheel");
  const [duelTour, setDuelTour] = useState(() => Boolean(me && readLocal<boolean>(tourKey, false) !== true));
  useEffect(() => {
    const firstVisit = Boolean(me && readLocal<boolean>(`ie.duel.tour.v1.${me}`, false) !== true);
    setScreen(firstVisit ? "duel" : "wheel");
    setDuelTour(firstVisit);
  }, [me]);
  function finishDuelTour() {
    if (me) writeLocal(tourKey, true);
    setDuelTour(false);
  }
  const duelReady = duel.data?.matches.some(c => (c.status === "pending" && c.b === me) || (c.status === "accepted" && !(c.a === me ? c.aReady : c.bReady)));
  useEffect(() => { if (duel.data) void game.refresh(); }, [duel.data, game.refresh]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [panel, setPanel] = useState<Panel>(null);
  const [rotation, setRotation] = useState(0);
  const [landing, setLanding] = useState<{ result: SpinResult; index: number } | null>(null);
  const caption = useMemo(() => landing ? describeLanding(landing.result, landing.index, lang) : null, [landing, lang]);
  const [reward, setReward] = useState<{ id: number; amount: number; simple: boolean } | null>(null);
  const [frozen, setFrozen] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [steal, setSteal] = useState<{ candidates: string[]; victim: string } | null>(null);
  const [effect, setEffect] = useState<PirateEffect | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [reduced, setReduced] = useState(false);
  const [sound, setSound] = useState(false);
  const [help, setHelp] = useState(false);
  const [order, setOrder] = useState<MirrorOrder | null>(null);
  const [notice, setNotice] = useState("");
  const [viewEmptyWheel, setViewEmptyWheel] = useState(false);
  const [summaryReady, setSummaryReady] = useState(false);
  const summaryRef = useRef<HTMLElement>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(false);
  const rewardSequence = useRef(0);
  const balanceRef = useRef<HTMLElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const wheelMs = reduced ? 100 : 3400;
  const stealMs = reduced ? 100 : 2600;
  const liveBoard = useMemo(() => leaderboard(ids, game.rows, game.dbSeason), [game.rows, game.dbSeason]);
  const liveEvents = useMemo(() => visibleEvents(game.events, ids, me), [game.events, me]);
  const view = frozen ?? { mine: game.mine, board: liveBoard, events: liveEvents };
  const { mine, board, events } = view;
  const left = mine?.spins ?? 0;
  const price = mirrorPrice(game.mine?.gold ?? 0);
  const targets = useMemo(() => me ? victims(me, ids, game.rows, game.dbSeason) : [], [me, game.rows, game.dbSeason]);
  const name = (id: string) => { const person = people.find((x) => x.id === id); return person ? p(person) : id; };
  const loading = !game.ready || (game.online && game.season !== "over" && !game.mine);
  const ended = game.season === "over";
  const seasonLabel = game.season === "practice" ? t("practiceBanner") : ended ? t("gameOver") : t("dayOf", { n: tripDayNumber(today) });

  useEffect(() => {
    alive.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setSound(readLocal("ie.pirate.sound", false));
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    const tick = () => {
      setToday(todayOverride(location.search, location.hostname) ?? irelandToday());
      setTimeLeft(countdown(nextDublinMidnightMs(new Date()) - Date.now()));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => {
      alive.current = false;
      document.body.style.overflow = previousOverflow;
      motion.removeEventListener("change", updateMotion);
      clearInterval(timer);
      void audio.current?.close();
      audio.current = null;
    };
  }, []);

  useEffect(() => { soundEnabled.current = sound; }, [sound]);

  function chime(kind: "spin" | "win" | "miss") {
    if (!soundEnabled.current) return;
    try {
      const context = audio.current ??= new AudioContext();
      void context.resume().catch(() => {});
      const notes = kind === "win" ? [523, 659, 784, 1047] : kind === "spin" ? [330, 440, 550] : [260, 196];
      notes.forEach((frequency, i) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + i * 0.085);
        gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + i * 0.085 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + i * 0.085 + 0.2);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + i * 0.085);
        oscillator.stop(context.currentTime + i * 0.085 + 0.22);
      });
    } catch { /* Sound is optional on browsers without Web Audio. */ }
  }

  function land(res: SpinResult, index: number) {
    const w = WEDGES[index];
    const { good } = describeLanding(res, index, lang);
    setLanding({ result: res, index });
    const earnsGold = res.applied && res.amount > 0 && (w.kind === "win" || w.kind === "shield" || (w.kind === "steal" && res.outcome === "hit"));
    setReward(earnsGold ? { id: ++rewardSequence.current, amount: res.amount, simple: w.kind === "win" } : null);
    setFrozen(null);
    setPhase("landed");
    chime(good ? "win" : "miss");
  }

  async function reveal(res: SpinResult, index: number) {
    const kind = WEDGES[index].kind;
    if (res.applied && (res.victim || kind === "shield" || kind === "spins")) {
      setEffect({
        kind: res.outcome === "blocked" ? "blocked" : res.outcome === "reflected" ? "mirror" : kind === "steal" ? "steal" : kind === "shield" ? "shield" : kind === "spins" ? "spins" : "bomb",
        target: res.victim ? who(res.victim) : undefined, amount: res.amount, shieldFull: kind === "shield" && res.amount > 0,
      });
      setPhase("impact");
      await wait(reduced ? 100 : 1300);
    }
    if (alive.current) land(res, index);
  }

  async function spin() {
    if (!me || left <= 0 || lock.current || !game.online || loading || ended) return;
    lock.current = true; setBusy(true);
    const index = pickWedge(Math.random), w = WEDGES[index];
    const snapshot = { mine: game.mine, board: liveBoard, events: liveEvents };
    setFrozen(snapshot); setLanding(null); setReward(null); setSteal(null); setEffect(null);
    setRotation((previous) => nextWheelRotation(previous, index, WEDGES.length));
    setPhase("spinning"); chime("spin");
    try {
      const [res] = await Promise.all([game.spin(w.kind, w.amount), wait(wheelMs + 80)]);
      if (!alive.current) return;
      if (w.kind === "boom" && res.applied) {
        setFrozen(null); setPhase("pick");
      } else if (w.kind === "steal" && res.applied && res.victim) {
        setSteal({ candidates: stealCandidates(snapshot.board, me, res.victim), victim: res.victim });
        setPhase("stealing"); chime("spin");
        await wait(stealMs + 100);
        if (alive.current) await reveal(res, index);
      } else await reveal(res, index);
    } catch {
      if (alive.current) land({ applied: false, victim: null, amount: 0, outcome: null }, index);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }

  const boomIndex = WEDGES.findIndex((w) => w.kind === "boom");
  async function boom(victim: string | null) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    setFrozen({ mine: game.mine, board: liveBoard, events: liveEvents });
    try {
      const res = await game.boomPick(victim);
      if (!alive.current) return;
      if (!res.applied && res.reason === "no boom pending") {
        setPhase("idle"); setFrozen(null);
      } else await reveal(res, boomIndex);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (game.mine?.boom_pending && phase === "idle") setPhase("pick");
  }, [game.mine?.boom_pending, phase]);

  function openPanel(next: Panel) { setPanel(next); setOrder(null); setNotice(""); }
  function quote(kind: "trade" | "buy") {
    if (!game.mine) return;
    setOrder({ kind, gold: game.mine.gold, shields: game.mine.shields, price });
    setNotice("");
  }
  async function confirmMirror() {
    if (!order || !game.mine || lock.current) return;
    if (mirrorOrderChanged(order, game.mine, price)) {
      setOrder({ ...order, gold: game.mine.gold, shields: game.mine.shields, price });
      setNotice(say("余额有变化，请查看新价格后再次确认。", "Your balance changed. Review the updated cost and confirm again."));
      return;
    }
    lock.current = true; setBusy(true);
    try {
      const result = await (order.kind === "trade" ? game.exchange() : game.buyMirror());
      if (!alive.current) return;
      if (result.applied) {
        setOrder(null); chime("win");
        setNotice(say("🪞 镜子已装备，下次攻击会被反弹！", "🪞 Mirror equipped. Your next incoming attack will bounce back!"));
      } else {
        const messages: Record<string, string> = {
          "mirror held": say("你已经有一面镜子。", "You already have a mirror."),
          "not enough gold": say("金币不足，请取消并重新查看余额。", "Not enough gold. Cancel and check your balance."),
          "not enough shields": say("需要两块盾牌。", "You need two shields."),
        };
        setNotice(messages[result.reason ?? ""] ?? say("未能确认交易，请检查网络和余额后重试。", "Purchase not confirmed. Check your connection and balance before retrying."));
      }
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  const resolving = phase === "spinning" || phase === "stealing" || phase === "impact";
  const canSpin = !busy && !loading && game.online && left > 0 && !ended && phase !== "pick";
  const exhausted = !loading && game.online && Boolean(mine) && left === 0 && !mine?.boom_pending && !ended;
  const showSummary = exhausted && summaryReady && !viewEmptyWheel;
  useEffect(() => {
    if (!exhausted) setViewEmptyWheel(false);
    if (!exhausted || busy || resolving || phase === "pick") { setSummaryReady(false); return; }
    if (phase !== "landed") { setSummaryReady(true); return; }
    // Let the 900ms count-up and 1200ms coin collection finish first.
    const timer = setTimeout(() => setSummaryReady(true), 1600);
    return () => clearTimeout(timer);
  }, [exhausted, busy, resolving, phase]);
  useEffect(() => {
    if (showSummary && !panel) summaryRef.current?.focus({ preventScroll: true });
  }, [showSummary, panel]);
  const panelTitle = order ? (order.kind === "trade" ? say("用盾牌换镜子？", "Trade shields for a mirror?") : say("购买镜子？", "Buy a mirror?"))
    : panel === "defend" ? say("守护你的宝藏", "Protect your treasure") : panel === "crew" ? t("leaderboard") : t("howToPlay");

  return (
    <div className="pirate-game pt-safe" data-online={String(game.online)} data-ready={String(game.ready)}>
      <div className="pirate-seascape" aria-hidden="true"><span className="pirate-island pirate-island-left" /><span className="pirate-island pirate-island-right" /><span className="pirate-sail">⛵</span></div>
      <div className="pirate-shell">
        <header className="pirate-header">
          <div><div className="pirate-eyebrow">{say("爱尔兰 · 家族争霸", "IRELAND · FAMILY RIVALRY")}</div><h1>☘ {say("三叶草海湾", "Clover Cove")}</h1></div>
          <div className="pirate-header-actions">
            <button className="pirate-icon-button pirate-language-button" onClick={onLang} aria-label={say("切换为英文", "Switch to Chinese")}>{lang === "zh" ? "EN" : "中文"}</button>
            <button className="pirate-icon-button" aria-label={sound ? say("关闭音效", "Mute sound") : say("开启音效", "Enable sound")} aria-pressed={sound} onClick={() => { setSound(!sound); writeLocal("ie.pirate.sound", !sound); }}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
            <button className="pirate-icon-button" onClick={onClose} disabled={busy} aria-label={say("返回行程", "Back to trip")}><X size={20} /></button>
          </div>
        </header>

        <div className="pirate-season"><span className="pirate-live-dot" />{screen === "duel" && duel.data ? (duel.data.practice ? say("练习 · 11月1日开赛", "PRACTICE · OFFICIAL 1 NOV") : say("正式对决", "OFFICIAL DUELS")) : seasonLabel}</div>

        <section className="pirate-hud" aria-label={say("你的宝藏", "Your treasure")}>
          <div className="pirate-player">{person && <Avatar person={person} size={36} />}<span>{person && p(person)}<small>{say("船长", "CAPTAIN")}</small></span></div>
          <div className="pirate-balance"><small>{say("你的金币", "YOUR GOLD")}</small><strong ref={balanceRef}>🪙 {loading ? "—" : <AnimatedGold value={mine?.gold ?? 1000} reduced={reduced} />}</strong></div>
          <button className="pirate-defense-summary" disabled={busy} onClick={() => { openPanel("defend"); setHelp(false); }} aria-label={say("查看盾牌和镜子", "View shields and mirror")}>
            <span>{Array.from({ length: MAX_SHIELDS }, (_, i) => <span key={i} className={i < (mine?.shields ?? 0) ? "" : "pirate-shield-empty"}>🛡️</span>)}<span className={mine?.mirror ? "" : "pirate-shield-empty"}>🪞</span></span><small>{say("防御装备", "DEFENSE")} ›</small>
          </button>
        </section>

        {screen === "duel" ? <PirateDuel duel={duel} onGoldChange={() => void game.refresh()} onTour={() => setDuelTour(true)} /> : showSummary ? <main ref={summaryRef} tabIndex={-1} className="pirate-session-summary" aria-labelledby="pirate-session-title">
          <div className="pirate-session-heading"><div><div className="pirate-eyebrow">{say("本轮冒险告一段落", "THAT'S A WRAP, CAPTAIN")}</div><h2 id="pirate-session-title">{say("家族战报", "From the crew")}</h2></div><button className="pirate-summary-wheel" onClick={() => setViewEmptyWheel(true)}>{say("查看转盘", "View wheel")} ↗</button></div>
          <div className="pirate-session-refill"><span>🎡 {t("nextDayIn")}</span><strong>{timeLeft}</strong></div>
          {caption && <div className={"pirate-session-last-result " + (caption.good ? "is-good" : "is-bad")}><small>{say("最后一转", "LAST SPIN")}</small><strong>{caption.icon} {caption.text}</strong></div>}
          <PirateCrew board={board} events={events} me={me} showTitle />
        </main> : <main className="pirate-play">
          <div className="pirate-stage-heading">
            <div className="pirate-eyebrow">{phase === "stealing" ? say("谁的宝藏会被偷走？", "WHOSE TREASURE WILL IT BE?") : phase === "pick" ? say("你的炸弹已准备好", "YOUR CANNON IS READY") : ended ? say("海湾的新王者", "THE COVE HAS ITS CHAMPION") : say("转出好运 · 偷走宝藏", "SPIN BIG. STEAL TREASURE.")}</div>
            <h2>{phase === "stealing" ? say("寻找你的目标", "The stealing wheel") : phase === "pick" ? say("选择你的目标", "Choose your target") : ended ? t("gameOver") : say("幸运转盘", "Wheel of fortune")}</h2>
          </div>

          <div className={"pirate-stage" + (phase === "impact" ? " pirate-stage-effect" : "")} aria-busy={resolving}>
            {phase === "stealing" && steal ? <StealWheel candidates={steal.candidates} victim={steal.victim} duration={stealMs} today={today} label={say("正在旋转目标转盘", "Target wheel spinning")} />
              : <PirateWheel rotation={rotation} duration={wheelMs} today={today} label={say("幸运转盘，十格机会相同", "Lucky wheel, ten equally likely wedges")} />}
            {phase === "pick" && <div className="pirate-target-picker">
              <div className="pirate-target-top"><span>💣</span><p>{t("pickBoom")}</p></div>
              <div className="pirate-targets">{targets.map((v) => <button key={v.id} disabled={busy} onClick={() => boom(v.id)}><Avatar person={who(v.id)} size={36} /><span>{name(v.id)}<small>{v.gold.toLocaleString() + " 🪙"}</small></span><span className="pirate-target-mark">⊕</span></button>)}</div>
              {targets.length === 0 && <button className="pirate-gold-button" disabled={busy} onClick={() => boom(null)}>{t("cap_boomNone")}</button>}
            </div>}
            {phase === "impact" && effect && <PirateEffects effect={effect} />}
          </div>

          <div className="pirate-result-slot" role="status" aria-live="polite" aria-atomic="true">
            {loading ? <p className="pirate-soft-text">{say("正在装载宝藏…", "Loading your treasure…")}</p>
              : !game.online ? <div className="pirate-connection"><span>📡 {t("needsSignal")}</span><button onClick={() => game.open()}>{say("重试", "Retry")}</button></div>
              : phase === "landed" && caption ? <div ref={rewardRef} className={"pirate-result " + (reward ? "pirate-result-coins " : "") + (caption.good ? "pirate-result-good" : "pirate-result-bad")}>
                {reward ? <><strong key={reward.id} className="pirate-reward-amount">🪙 +<AnimatedGold value={reward.amount} from={0} reduced={reduced} /></strong><small>{reward.simple ? say("金币已入账", "ADDED TO YOUR TREASURE") : caption.text}</small></> : <><span>{caption.icon}</span><strong>{caption.text}</strong></>}
                {caption.good && <div className="pirate-sparkles" aria-hidden="true">✦ <span>✦</span> ✧</div>}
              </div>
              : phase === "spinning" ? <p className="pirate-soft-text">{say("好运正在转动…", "A little luck is on its way…")}</p>
              : phase === "stealing" ? <p className="pirate-soft-text">{say("转盘决定目标，不会额外消耗次数", "Finding your target · no extra spin used")}</p>
              : phase === "impact" ? <p className="pirate-soft-text">{effect?.kind === "shield" ? say("守护宝藏，准备就绪", "A little extra protection for your treasure") : effect?.kind === "spins" ? say("好运还没结束！", "Your adventure isn't over yet!") : say("宝藏争夺战！", "A clash over treasure!")}</p>
              : phase === "pick" ? <p className="pirate-soft-text">{say("炸掉 20% 金币，不限次数", "Destroy 20% of their gold · no daily limit")}</p>
              : ended ? <p className="pirate-champion">👑 {board.filter((x) => x.leader).map((x) => name(x.id)).join(" & ")}</p>
              : dayMultiplier(today) > 1 ? <p className="pirate-soft-text">{t("prizesToday", { m: dayMultiplier(today).toFixed(1) })}</p> : null}
          </div>

          <button className="pirate-gold-button pirate-spin-button" disabled={!canSpin} onClick={spin}>
            <span>{resolving ? say("冒险进行中…", "ADVENTURE IN MOTION…") : phase === "pick" ? say("选择上方的目标", "CHOOSE A TARGET ABOVE") : ended ? say("本次航行已结束", "VOYAGE COMPLETE") : left <= 0 && !loading ? say("等待新的转盘次数", "MORE SPINS ON THE HORIZON") : phase === "landed" ? t("spinAgain") : t("spin")}</span>
            {!resolving && !ended && phase !== "pick" && <small>🎡 {left} · {t("spinsLeft")}</small>}
          </button>
          <div className="pirate-refill">{!ended && !loading && !resolving && <><span>{left <= 0 ? t("nextDayIn") : say("每日补充 +5 次", "DAILY REFILL +5 SPINS")}</span><strong>{timeLeft}</strong>{exhausted && viewEmptyWheel && <button className="pirate-summary-link" onClick={() => setViewEmptyWheel(false)}>{say("排行榜与动态", "Rankings & news")} ›</button>}</>}</div>
        </main>}

        <nav className="pirate-dock" aria-label={say("游戏菜单", "Game menu")}>
          <button className={screen === "wheel" ? "pirate-dock-active" : ""} disabled={busy || duel.busy} onClick={() => { setScreen("wheel"); openPanel(null); if (exhausted) setViewEmptyWheel(false); }}><span>{showSummary ? "🏆" : "🎡"}</span>{showSummary ? say("战报", "SUMMARY") : say("转盘", "PLAY")}</button>
          <button className={screen === "duel" ? "pirate-dock-active" : ""} disabled={busy || duel.busy} onClick={() => { setScreen("duel"); openPanel(null); }}><Swords size={23} />{say("对决", "DUEL")}{duelReady && <i />}</button>
          <button disabled={busy} onClick={() => { openPanel("defend"); setHelp(false); }}><Shield size={23} />{say("防御", "DEFEND")}{mine?.mirror && <i />}</button>
          <button disabled={busy} onClick={() => openPanel("crew")}><Trophy size={23} />{say("家族", "CREW")}</button>
          <button disabled={busy} onClick={() => openPanel("rules")}><BookOpen size={23} />{say("玩法", "RULES")}</button>
        </nav>
      </div>

      {reward && phase === "landed" && <CoinCollection key={reward.id} origin={rewardRef} destination={balanceRef} reduced={reduced} />}

      {duelTour && <GameDialog title={say("对决入门", "Duel basics")} busy={false} onClose={finishDuelTour} closeLabel={say("跳过教程", "Skip tour")}>
        <DuelTour onFinish={finishDuelTour} practice={duel.data?.practice ?? today < "2026-11-01"} />
      </GameDialog>}

      {panel && <GameDialog title={panelTitle} busy={busy} onClose={() => { setPanel(null); setOrder(null); }} closeLabel={say("关闭", "Close")}>
        {order ? <div className="pirate-mirror-confirm">
          <div className="pirate-mirror-art">🪞</div>
          <p>{say("装备一面镜子，挡下并反弹下一次偷窃或炸弹，用后消失。", "Equip one mirror to block and reflect the next steal or bomb. It is used up after one attack.")}</p>
          <div className="pirate-cost"><span>{order.kind === "trade" ? say("消耗", "YOU SPEND") : say("价格", "PRICE")}</span><strong>{order.kind === "trade" ? "2 🛡️" : order.price.toLocaleString() + " 🪙"}</strong></div>
          <div className="pirate-cost"><span>{order.kind === "trade" ? say("盾牌余额", "SHIELDS AFTER TRADE") : say("金币余额", "GOLD AFTER PURCHASE")}</span><strong>{order.kind === "trade" ? order.shields + " → " + Math.max(0, order.shields - 2) : order.gold.toLocaleString() + " → " + Math.max(0, order.gold - order.price).toLocaleString()}</strong></div>
          <p className="pirate-soft-text">{order.kind === "trade" ? say("这次兑换只有你能在动态中看到。", "This trade is private in the activity feed.") : say("金币购买会出现在家族动态中。", "This gold purchase appears in the family activity feed.")}</p>
          {notice && <p role="status" className="pirate-notice">{notice}</p>}
          <button className="pirate-gold-button" disabled={busy || !game.online || !game.mine || game.mine.mirror || ended || (order.kind === "trade" ? game.mine.shields < 2 : game.mine.gold < price)} onClick={confirmMirror}>{busy ? say("正在确认…", "Confirming…") : order.kind === "trade" ? say("确认消耗 2 块盾牌", "Trade 2 shields") : say("确认购买", "Buy for") + " " + order.price.toLocaleString() + " 🪙"}</button>
          <button className="pirate-secondary-button" disabled={busy} onClick={() => { setOrder(null); setNotice(""); }}>{say("取消", "Cancel")}</button>
        </div> : panel === "defend" ? <div>
          <div className="pirate-defense-inventory"><div><span>🛡️</span><strong>{game.mine?.shields ?? 0} / {MAX_SHIELDS}</strong><small>{say("盾牌", "SHIELDS")}</small></div><div><span>🪞</span><strong>{game.mine?.mirror ? "1 / 1" : "0 / 1"}</strong><small>{say("镜子", "MIRROR")}</small></div></div>
          <div className="pirate-mirror-heading"><h3>{say("反弹镜", "The comeback mirror")}</h3><button className="pirate-icon-button" aria-expanded={help} aria-controls="pirate-mirror-help" aria-label={say("镜子有什么用？", "How does a mirror work?")} onClick={() => setHelp(!help)}><HelpCircle size={23} /></button></div>
          <p className="pirate-soft-text">{say("让下一位攻击你的人，自食其果。", "A little protection. A very satisfying comeback.")}</p>
          {help && <div id="pirate-mirror-help" className="pirate-help">
            <p>{say("🪞 镜子优先于盾牌，自动挡下并反弹下一次偷窃或炸弹，然后消失。最多持有一面。", "🪞 A mirror activates before your shields. It blocks and reflects the next steal or bomb, then disappears. You can hold one.")}</p>
            <p>{say("🏴‍☠️ 被偷时：攻击者反而把同样数量的金币付给你。💣 被炸时：攻击者自己损失金币。反弹金额不超过攻击者的余额。", "🏴‍☠️ Steal: the attacker pays you instead. 💣 Bomb: the attacker loses their own gold. Reflected damage is capped at the attacker's balance.")}</p>
            <p>{say("🛡️ 每块盾牌只挡一次攻击，不会反弹。镜子使用后，你的盾牌仍然保留。", "🛡️ Each shield blocks one attack without reflecting it. A mirror leaves your shields untouched.")}</p>
            <p>{say("兑换消耗两块盾牌；金币价格为余额的 30%（向下取整到十位），最低 300。金币购买为公开动态，盾牌兑换为私密动态。", "Trade costs two shields. Gold price is 30% of your balance, rounded down to tens, minimum 300. Gold purchases are public in the feed; shield trades are private.")}</p>
          </div>}
          {notice && <p role="status" className="pirate-notice">{notice}</p>}
          {game.mine?.mirror ? <div className="pirate-equipped">✦ {say("镜子已装备，下一次攻击会被反弹", "Mirror armed. The next attack bounces back.")}</div> : <>
            <div className="pirate-shop-option"><div><strong>2 🛡️ → 1 🪞</strong><small>{say("秘密兑换", "PRIVATE TRADE")}</small></div><button disabled={busy || loading || !game.online || ended || (game.mine?.shields ?? 0) < 2} onClick={() => quote("trade")}>{say("兑换", "Trade")}</button></div>
            <div className="pirate-shop-option"><div><strong>{price.toLocaleString()} 🪙 → 1 🪞</strong><small>{say("金币购买 · 家族可见", "GOLD PURCHASE · PUBLIC")}</small></div><button disabled={busy || loading || !game.online || ended || (game.mine?.gold ?? 0) < price} onClick={() => quote("buy")}>{say("购买", "Buy")}</button></div>
            <p className="pirate-soft-text pirate-shop-hint">{say("点击兑换或购买后，先确认再扣除。", "You'll review and confirm the cost before spending.")}</p>
          </>}
        </div> : panel === "crew" ? <PirateCrew board={board} events={events} me={me} /> : <ul className="pirate-rules">{RULES.map((rule, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{p(rule)}</p></li>)}</ul>}
      </GameDialog>}
    </div>
  );
}

function GameDialog({ title, busy, onClose, closeLabel, children }: { title: string; busy: boolean; onClose: () => void; closeLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { if (dialog?.open) dialog.close(); }; }, []);
  return <dialog ref={ref} className="pirate-dialog" aria-labelledby="pirate-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="pirate-dialog-header"><h2 id="pirate-dialog-title">{title}</h2><button className="pirate-icon-button" aria-label={closeLabel} disabled={busy} onClick={onClose}><X size={21} /></button></div>
    <div className="pirate-dialog-content">{children}</div>
  </dialog>;
}

const RULES = [
  { zh: "大家从 1,000 金币开始。每天早上（爱尔兰时间）多 5 次转盘，没用完的会留着。", en: "Everyone starts with 1,000 gold. Every Irish morning you get 5 more spins; unused ones carry over." },
  { zh: "转盘 10 格，每格机会一样：💰 50 / 100 / 150 / 200 / 300 / 500 直接进口袋，而且奖金每天变大（第 14 天 ×3）。", en: "Ten equal wedges: 💰 50 / 100 / 150 / 200 / 300 / 500 go straight into your gold, and prizes grow every day (×3 on Day 14)." },
  { zh: "🏴‍☠️ 偷：随机偷一个人 15% 的金币（最后一名偷不到）。💣 炸：你选一个人，他损失 20%（炸掉，不归你）；同一个人可以被炸多次，没有每日限制。", en: "🏴‍☠️ Steal takes 15% from a random person (never the one in last place). 💣 Boom: you pick someone, they lose 20% (destroyed, not yours); the same person can be bombed any number of times." },
  { zh: `🛡️ 盾牌：挡一次攻击，最多 ${MAX_SHIELDS} 块，别人看不到你有几块。🎰 多 3 次转盘。`, en: `🛡️ Shield blocks one attack, up to ${MAX_SHIELDS}, hidden from others. 🎰 gives +3 spins.` },
  { zh: "🪞 镜子（最多一面）：优先于盾牌，挡下下一次攻击并反弹同样伤害，用后消失。两块盾牌悄悄换一面，或花 30% 金币买一面，最低 300（大家都会看到）。", en: "🪞 Mirror (max one): activates before shields, blocks the next attack and sends the same hit back, then is used up. Trade two shields for one quietly, or buy one for 30% of your gold, minimum 300 (everyone sees that)." },
  { zh: `10月25日第 1 天大家重新从 1,000 开始，第 ${DAYS} 天（11月7日）结束，最多的人是海盗王 👑`, en: `Day 1 (25 Oct) everyone restarts at 1,000; after Day ${DAYS} (7 Nov) the richest is Pirate King 👑` },
];


