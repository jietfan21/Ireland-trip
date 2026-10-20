"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { people, type Day, type Person } from "@/lib/trip";
import { bubbleLeft, castForDay, crew, pickLine, stepWalk } from "@/lib/crew";
import { usePirateLeaders } from "@/lib/pirateStore";
import { useApp } from "./common";

// Sizes (px). A 180 cm person is the full-size body; shorter people get a shorter body, same head.
const STRIP_H = 150;
const GROUND = 18; // ground line from the strip bottom
const FIG_W = 40;
const HEAD = 36;
const BODY_H = 52; // body SVG height at scale 1
const HEAD_OVERLAP = 6;
const TAP_SLOP = 8;
const HIGH_FIVE = 40;
const SPACING = 44;
const BUBBLE_MS = 2500;
const JUMP_MS = 500;
const BURST_MS = 700;

type Mode = "walk" | "stand" | "drag";
type Fig = { x: number; dir: 1 | -1; mode: Mode; target: number; until: number; speed: number; placed: boolean };
type Bubble = { key: number; id: string; x: number; y: number; text: string };
type Spark = { key: number; x: number; y: number; dx: number; dy: number };

const byId = Object.fromEntries(crew.map((m) => [m.id, m]));
const person = (id: string) => people.find((p) => p.id === id) as Person;
const scaleOf = (id: string) => byId[id].height / 180;
const figH = (id: string) => HEAD - HEAD_OVERLAP + BODY_H * scaleOf(id);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export default function Crew({ day }: { day: Day }) {
  const { p } = useApp();
  const strip = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const figs = useRef(new Map<string, Fig>());
  const nodes = useRef(new Map<string, HTMLButtonElement>());
  const lastLine = useRef(new Map<string, number>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const drag = useRef<{ id: string; pointerId: number; x0: number; y0: number; left: number; moved: boolean } | null>(null);
  const reduced = useRef(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [, bump] = useState(0);

  const cast = useMemo(() => castForDay(day.n), [day.n]);
  const leaders = usePirateLeaders(); // 👑 for whoever leads the pirate game
  const ids = cast.map((c) => c.id);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const maxX = () => Math.max(0, widthRef.current - FIG_W);
  const clamp = (x: number) => Math.min(maxX(), Math.max(0, x));

  // Figures keep their spot across day changes; newcomers get a random one once the strip has a width.
  for (const id of ids) {
    if (!figs.current.has(id)) {
      figs.current.set(id, { x: 0, dir: 1, mode: "stand", target: 0, until: performance.now() + rand(500, 2000), speed: rand(18, 30), placed: false });
    }
  }
  const apply = (id: string) => {
    const f = figs.current.get(id);
    const n = nodes.current.get(id);
    if (!f || !n) return;
    n.style.transform = `translateX(${f.x}px) scaleX(${f.dir})`;
    n.classList.toggle("crew-walk", f.mode === "walk");
  };

  const pickTarget = (id: string) => {
    const others = ids.filter((o) => o !== id).map((o) => figs.current.get(o)?.x ?? -999);
    let t = rand(8, Math.max(8, maxX() - 8));
    for (let i = 0; i < 5 && others.some((o) => Math.abs(o - t) < SPACING); i++) t = rand(8, Math.max(8, maxX() - 8));
    return t;
  };

  const place = (id: string) => {
    const f = figs.current.get(id)!;
    if (f.placed || widthRef.current === 0) return;
    f.x = f.target = pickTarget(id);
    f.placed = true;
  };

  const flash = (id: string, cls: string, ms: number) => {
    nodes.current.get(id)?.classList.add(cls);
    later(() => nodes.current.get(id)?.classList.remove(cls), ms);
  };

  // Width: measured, and re-measured on rotate / resize.
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      widthRef.current = el.clientWidth;
      ids.forEach(place);
      if (reduced.current) {
        ids.forEach((id, i) => {
          const f = figs.current.get(id)!;
          f.x = ids.length > 1 ? (i * (maxX() - 16)) / (ids.length - 1) + 8 : maxX() / 2;
          f.mode = "stand";
          apply(id);
        });
      } else ids.forEach((id) => apply(id));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.n]);

  // The one animation loop. Pauses while the page is hidden.
  useEffect(() => {
    if (reduced.current) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      for (const id of ids) {
        const f = figs.current.get(id)!;
        if (f.mode === "walk") {
          const r = stepWalk(f, dt, maxX());
          f.x = r.x;
          f.dir = r.dir;
          if (r.arrived) {
            f.mode = "stand";
            f.until = now + rand(1000, 4000);
            const near = ids.some((o) => o !== id && Math.abs((figs.current.get(o)?.x ?? -999) - f.x) < 60);
            if (near && Math.random() < 0.2) flash(id, "crew-wave", 1500);
          }
        } else if (f.mode === "stand" && now >= f.until) {
          f.target = pickTarget(id);
          f.mode = "walk";
        }
        f.x = clamp(f.x);
        apply(id);
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.n]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const say = (id: string, text: string, ms: number) => {
    const f = figs.current.get(id)!;
    const key = Math.random();
    setBubbles((b) => [...b, { key, id, x: f.x + FIG_W / 2, y: GROUND + figH(id) + 4, text }]);
    later(() => setBubbles((b) => b.filter((x) => x.key !== key)), ms);
  };

  const tap = (id: string) => {
    const f = figs.current.get(id)!;
    f.mode = "stand";
    f.until = performance.now() + BUBBLE_MS;
    apply(id);
    if (!reduced.current) flash(id, "crew-jump", JUMP_MS);
    const lines = byId[id].lines;
    const k = pickLine(lines.length, lastLine.current.get(id) ?? -1);
    lastLine.current.set(id, k);
    say(id, p(lines[k]), BUBBLE_MS);
    const burst: Spark[] = Array.from({ length: 5 }, () => ({
      key: Math.random(),
      x: f.x + FIG_W / 2,
      y: GROUND + figH(id) * 0.7,
      dx: rand(-36, 36),
      dy: rand(-56, -20),
    }));
    setSparks((s) => [...s, ...burst]);
    later(() => setSparks((s) => s.filter((x) => !burst.includes(x))), BURST_MS);
  };

  const drop = (id: string) => {
    const f = figs.current.get(id)!;
    const now = performance.now();
    f.mode = "stand";
    f.until = now + 800;
    nodes.current.get(id)?.classList.remove("crew-dangle", "crew-lifted");
    flash(id, "crew-wobble", 450);
    apply(id);
    const buddy = ids.find((o) => o !== id && Math.abs((figs.current.get(o)?.x ?? -999) - f.x) < HIGH_FIVE);
    if (buddy) {
      for (const who of [id, buddy]) {
        const g = figs.current.get(who)!;
        g.mode = "stand";
        g.until = now + 900;
        flash(who, "crew-wave", 1500);
        say(who, "✋", 900);
      }
    }
  };

  const onDown = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current) return; // one finger at a time: a second touch is ignored until the first lifts
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {} // a pointer that's already gone (or a synthetic event) can't be captured; the drag still works
    drag.current = { id, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, left: strip.current?.getBoundingClientRect().left ?? 0, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) <= TAP_SLOP) return;
    const f = figs.current.get(d.id)!;
    if (!d.moved) {
      d.moved = true;
      f.mode = "drag";
      nodes.current.get(d.id)?.classList.add("crew-dangle", "crew-lifted");
    }
    f.x = clamp(e.clientX - d.left - FIG_W / 2);
    apply(d.id);
  };
  const onUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (d.moved) drop(d.id);
    else tap(d.id);
  };

  return (
    <div ref={strip} className="relative w-full overflow-x-clip" style={{ height: STRIP_H }} data-crew>
      <div className="absolute inset-x-0 h-0.5 rounded bg-line" style={{ bottom: GROUND }} />
      {cast.map((c) => (
        <Figure
          key={c.id}
          id={c.id}
          waving={c.waving}
          crown={leaders.includes(c.id)}
          label={p(person(c.id))}
          nodeRef={(n) => {
            if (n) {
              nodes.current.set(c.id, n);
              apply(c.id);
            } else nodes.current.delete(c.id);
          }}
          onDown={onDown(c.id)}
          onMove={onMove}
          onUp={onUp}
        />
      ))}
      {bubbles.map((b) => (
        <div
          key={b.key}
          className="crew-bubble-in pointer-events-none absolute z-20 max-w-[160px] rounded-2xl border border-line bg-white px-2.5 py-1 text-center text-[13px] leading-snug text-ink shadow-[0_2px_10px_#17322d1a]"
          style={{ left: bubbleLeft(b.x, widthRef.current), bottom: b.y, transform: "translateX(-50%)" }}
        >
          {b.text}
          <span className="absolute left-1/2 top-full -ml-1.5 h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-white" />
        </div>
      ))}
      {sparks.map((s) => (
        <span
          key={s.key}
          className="crew-burst pointer-events-none absolute z-20 text-[16px]"
          style={{ left: s.x - 8, bottom: s.y, ["--dx" as string]: `${s.dx}px`, ["--dy" as string]: `${s.dy}px` }}
        >
          ☘️
        </span>
      ))}
    </div>
  );
}

function Figure({
  id,
  waving,
  crown,
  label,
  nodeRef,
  onDown,
  onMove,
  onUp,
}: {
  id: string;
  waving: boolean;
  crown: boolean;
  label: string;
  nodeRef: (n: HTMLButtonElement | null) => void;
  onDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const [broken, setBroken] = useState(false);
  const who = person(id);
  const s = scaleOf(id);
  const bodyH = BODY_H * s;
  return (
    <button
      ref={nodeRef}
      type="button"
      aria-label={label}
      className={`crew-fig absolute left-0 flex flex-col items-center ${waving ? "crew-waving" : ""}`}
      style={{ bottom: GROUND, width: FIG_W, height: HEAD - HEAD_OVERLAP + bodyH, willChange: "transform" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {crown && (
        <span className="pointer-events-none absolute -top-[15px] left-1/2 z-20 -translate-x-1/2 text-[18px] leading-none drop-shadow" aria-label="👑">
          👑
        </span>
      )}
      <span className="relative z-10 grid shrink-0 place-items-center rounded-full font-bold text-white" style={{ width: HEAD, height: HEAD }}>
        {broken ? (
          <span className="grid h-full w-full place-items-center rounded-full text-[15px]" style={{ background: who.color }}>
            {who.zh.slice(-1)}
          </span>
        ) : (
          <img src={`/avatars/${id}.webp`} alt="" draggable={false} onError={() => setBroken(true)} className="pointer-events-none h-full w-full select-none" />
        )}
      </span>
      <svg
        viewBox={`0 0 ${FIG_W} ${BODY_H}`}
        width={FIG_W}
        height={bodyH}
        className="pointer-events-none shrink-0"
        style={{ marginTop: -HEAD_OVERLAP }}
        stroke={who.color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="20" y1="0" x2="20" y2="26" />
        <line className="arm-l" x1="20" y1="6" x2="8" y2="22" style={{ transformOrigin: "20px 6px" }} />
        <line className="arm-r" x1="20" y1="6" x2="32" y2="22" style={{ transformOrigin: "20px 6px" }} />
        <line className="leg-l" x1="20" y1="26" x2="11" y2="52" style={{ transformOrigin: "20px 26px" }} />
        <line className="leg-r" x1="20" y1="26" x2="29" y2="52" style={{ transformOrigin: "20px 26px" }} />
      </svg>
    </button>
  );
}
