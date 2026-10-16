"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// localStorage can throw (private mode, blocked storage) — never let it break the app.
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setValue(readLocal(key, fallback));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setValue(v);
      writeLocal(key, v);
    },
    [key],
  );
  return [value, set, ready] as const;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let client: SupabaseClient | null = null;
function db() {
  if (!url || !anon) return null;
  client ??= createClient(url, anon, { auth: { persistSession: false } });
  return client;
}
export const sharedEnabled = Boolean(url && anon);

type Ticks = Record<string, boolean>;
const TICKS_KEY = "ie.ticks";

// Checklist ticks: key is `${itemId}:${personId}` (team to-dos use personId "team").
// Shared through Supabase when configured, otherwise kept on this phone.
export function useTicks() {
  const [ticks, setTicksState] = useState<Ticks>({});
  const ref = useRef<Ticks>({});
  const setTicks = (t: Ticks) => {
    ref.current = t;
    setTicksState(t);
  };

  useEffect(() => {
    setTicks(readLocal<Ticks>(TICKS_KEY, {}));
    const supa = db();
    if (!supa) return;
    let alive = true;
    const load = async () => {
      const { data } = await supa.from("ireland_checks").select("key, done");
      if (!alive || !data) return;
      const next: Ticks = {};
      for (const r of data) next[r.key] = r.done;
      setTicks(next);
      writeLocal(TICKS_KEY, next);
    };
    load();
    const channel = supa
      .channel("ireland_checks")
      .on("postgres_changes", { event: "*", schema: "public", table: "ireland_checks" }, load)
      .subscribe();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      supa.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
  }, []);

  const toggle = useCallback(async (key: string, by: string) => {
    const done = !ref.current[key];
    const next = { ...ref.current, [key]: done };
    ref.current = next;
    setTicksState(next);
    writeLocal(TICKS_KEY, next);
    const supa = db();
    if (supa) await supa.from("ireland_checks").upsert({ key, done, by, updated_at: new Date().toISOString() });
  }, []);

  return { ticks, toggle };
}
