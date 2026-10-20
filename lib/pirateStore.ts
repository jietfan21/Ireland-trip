"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./store";
import { leaderboard, seasonFor, todayOverride, type Event, type PlayerRow, type Wedge } from "./pirate";
import { people } from "./trip";

export function irelandToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Dublin" }).format(new Date());
}

const TIMEOUT_MS = 8000;
// A request that doesn't settle in time counts as offline (patchy signal, unreachable host).
function withTimeout<T>(p: PromiseLike<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// crypto.randomUUID needs a secure context (missing over plain-HTTP LAN testing and on old iOS).
function turnKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export type Outcome = "hit" | "blocked" | "reflected" | "none" | null;
export type SpinResult = {
  applied: boolean;
  reason?: string;
  replayed?: boolean;
  row?: PlayerRow;
  victim: string | null;
  amount: number;
  outcome: Outcome;
};
const offline: SpinResult = { applied: false, reason: "offline", victim: null, amount: 0, outcome: null };

// Shared game state for one viewer. All writes go through the pirate_open / pirate_spin /
// pirate_exchange SQL functions (relative updates, replay-safe by turn key); this hook only reads and calls them.
export function usePirate(me: string | null, today: string) {
  const [rows, setRows] = useState<PlayerRow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const opened = useRef(false); // did pirate_open succeed for this person/day? (retried by sync() until it does)
  const season = seasonFor(today);
  const dbSeason = season === "over" ? "trip" : season; // after Day 14 we keep showing the trip's result

  const refresh = useCallback(async () => {
    const db = supabase();
    if (!db) {
      setOnline(false);
      setReady(true);
      return;
    }
    try {
      const [p, e] = await withTimeout(
        Promise.all([
          db.from("pirate_players").select("*"),
          db.from("pirate_events").select("*").eq("season", dbSeason).order("at", { ascending: false }).limit(40),
        ]),
      );
      if (p.error || e.error) throw p.error ?? e.error;
      setRows(p.data as PlayerRow[]);
      setEvents(e.data as Event[]);
      setOnline(true);
    } catch {
      setOnline(false);
    }
    setReady(true);
  }, [dbSeason]);

  // Make sure my row exists and is current (season reset, daily spin credit), then reload.
  const open = useCallback(async () => {
    const db = supabase();
    if (db && me && season !== "over") {
      try {
        const { error } = await withTimeout(db.rpc("pirate_open", { p_player: me, p_season: dbSeason, p_day: today }));
        if (error) throw error;
        opened.current = true;
      } catch {
        opened.current = false;
        setOnline(false);
        setReady(true);
        return;
      }
    }
    await refresh();
  }, [me, season, dbSeason, today, refresh]);

  // Periodic / focus / realtime sync: a plain reload, or another go at opening if that never succeeded.
  const sync = useCallback(() => (opened.current || !me || season === "over" ? refresh() : open()), [me, season, refresh, open]);

  // One call with one retry on the same key: the server replays a call that did land.
  const rpc = useCallback(
    async (fn: string, args: Record<string, unknown>) => {
      const db = supabase();
      if (!db || !me) return null;
      const call = () => withTimeout(db.rpc(fn, args));
      let res = await call().catch((e: Error) => ({ error: e, data: null }));
      if (res.error) res = await call();
      if (res.error) throw res.error;
      return res.data as Record<string, unknown>;
    },
    [me],
  );

  const spin = useCallback(
    async (kind: Wedge, amount?: number, victim?: string): Promise<SpinResult> => {
      if (!me) return offline;
      try {
        const j = await rpc("pirate_spin", { p_player: me, p_day: today, p_kind: kind, p_amount: amount ?? null, p_victim: victim ?? null, p_turn_key: turnKey() });
        if (!j) return offline;
        setOnline(true);
        await refresh();
        return {
          applied: Boolean(j.applied),
          reason: j.reason as string | undefined,
          replayed: Boolean(j.replayed),
          row: j.row as PlayerRow | undefined,
          victim: (j.victim as string | null) ?? null,
          amount: Number(j.amount ?? 0),
          outcome: (j.outcome as Outcome) ?? null,
        };
      } catch {
        setOnline(false);
        return offline;
      }
    },
    [me, today, rpc, refresh],
  );

  // Second half of a boom: pick the victim (null = nobody left to boom).
  const boomPick = useCallback(
    async (victim: string | null): Promise<SpinResult> => {
      if (!me) return offline;
      try {
        const j = await rpc("pirate_boom", { p_player: me, p_day: today, p_victim: victim, p_turn_key: turnKey() });
        if (!j) return offline;
        setOnline(true);
        await refresh();
        return {
          applied: Boolean(j.applied),
          reason: j.reason as string | undefined,
          replayed: Boolean(j.replayed),
          row: j.row as PlayerRow | undefined,
          victim: (j.victim as string | null) ?? null,
          amount: Number(j.amount ?? 0),
          outcome: (j.outcome as Outcome) ?? null,
        };
      } catch {
        setOnline(false);
        return offline;
      }
    },
    [me, today, rpc, refresh],
  );

  const buyMirror = useCallback(async (): Promise<{ applied: boolean; reason?: string }> => {
    if (!me) return { applied: false, reason: "offline" };
    try {
      const j = await rpc("pirate_buy_mirror", { p_player: me, p_day: today, p_turn_key: turnKey() });
      if (!j) return { applied: false, reason: "offline" };
      setOnline(true);
      await refresh();
      return { applied: Boolean(j.applied), reason: j.reason as string | undefined };
    } catch {
      setOnline(false);
      return { applied: false, reason: "offline" };
    }
  }, [me, today, rpc, refresh]);

  const exchange = useCallback(async (): Promise<{ applied: boolean; reason?: string }> => {
    if (!me) return { applied: false, reason: "offline" };
    try {
      const j = await rpc("pirate_exchange", { p_player: me, p_day: today, p_turn_key: turnKey() });
      if (!j) return { applied: false, reason: "offline" };
      setOnline(true);
      await refresh();
      return { applied: Boolean(j.applied), reason: j.reason as string | undefined };
    } catch {
      setOnline(false);
      return { applied: false, reason: "offline" };
    }
  }, [me, today, rpc, refresh]);

  useEffect(() => {
    opened.current = false;
    open();
  }, [open]);

  useEffect(() => {
    const db = supabase();
    if (!db) return;
    // Unique topic per mount: a reused name can land on a channel that's still leaving and never subscribes.
    const channel = db
      .channel(`pirate-${turnKey()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pirate_players" }, sync)
      .on("postgres_changes", { event: "*", schema: "public", table: "pirate_events" }, sync)
      .subscribe();
    const onFocus = () => sync();
    window.addEventListener("focus", onFocus);
    const timer = setInterval(sync, 60000);
    return () => {
      db.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, [sync]);

  const mine = me ? (rows.find((r) => r.id === me && r.season === dbSeason) ?? null) : null;
  return { ready, online, rows, events, mine, season, dbSeason, open, spin, boomPick, exchange, buyMirror, refresh };
}

// For the header's red dot: spins to use (or a day's credit waiting). One light read of the own row.
export function useDrawAvailable(me: string | null, tick = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const db = supabase();
    if (!db || !me) {
      setReady(false);
      return;
    }
    let alive = true;
    const check = async () => {
      const today = todayOverride(location.search, location.hostname) ?? irelandToday();
      const season = seasonFor(today);
      if (season === "over") return setReady(false);
      const { data, error } = await db.from("pirate_players").select("*").eq("id", me).maybeSingle();
      if (!alive || error) return;
      const r = data as PlayerRow | null;
      setReady(!r || r.season !== season || r.day !== today || r.spins > 0);
    };
    check();
    window.addEventListener("focus", check);
    return () => {
      alive = false;
      window.removeEventListener("focus", check);
    };
  }, [me, tick]);
  return ready;
}

// Who's wearing the crown right now (empty while everyone is tied or offline). Used by the crew strip.
export function usePirateLeaders(): string[] {
  const [leaders, setLeaders] = useState<string[]>([]);
  useEffect(() => {
    const db = supabase();
    if (!db) return;
    let alive = true;
    const ids = people.map((p) => p.id);
    const load = async () => {
      const today = todayOverride(location.search, location.hostname) ?? irelandToday();
      const season = seasonFor(today);
      const { data, error } = await db.from("pirate_players").select("*");
      if (!alive || error || !data) return;
      const board = leaderboard(ids, data as PlayerRow[], season === "over" ? "trip" : season);
      const contested = board.some((x) => x.gold !== board[0].gold);
      setLeaders(contested ? board.filter((x) => x.leader).map((x) => x.id) : []);
    };
    load();
    const channel = db
      .channel(`pirate-leaders-${turnKey()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pirate_players" }, load)
      .subscribe();
    window.addEventListener("focus", load);
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      db.removeChannel(channel);
      window.removeEventListener("focus", load);
      clearInterval(timer);
    };
  }, []);
  return leaders;
}
