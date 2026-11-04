"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalendarDays, House, Info, ListChecks, Map as MapIcon } from "lucide-react";
import { people, type Person } from "@/lib/trip";
import "@/lib/nov3";
import "@/lib/nov4";
import "@/lib/nov5";
import type { Lang } from "@/lib/i18n";
import { readLocal, writeLocal } from "@/lib/store";
import { AppCtx, Avatar, type Tab, useApp } from "@/components/common";
import TodayView from "@/components/TodayView";
import TripView from "@/components/TripView";
import MapView from "@/components/MapView";
import InfoView from "@/components/InfoView";
import ToolsView from "@/components/ToolsView";
import WhoAreYou from "@/components/WhoAreYou";
import PirateSheet from "@/components/PirateSheet";
import { useDrawAvailable } from "@/lib/pirateStore";
import { ViewMemory } from "@/components/ViewMemory";

const TABS: { id: Tab; icon: typeof House }[] = [
  { id: "today", icon: House },
  { id: "trip", icon: CalendarDays },
  { id: "map", icon: MapIcon },
  { id: "info", icon: Info },
  { id: "tools", icon: ListChecks },
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [person, setPerson] = useState<Person | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [jump, setJump] = useState<number | undefined>();
  const [picking, setPicking] = useState(false);
  const [pirate, setPirate] = useState(false);
  const [pirateTick, setPirateTick] = useState(0);
  const shell = useRef<HTMLDivElement>(null);
  const activeTab = useRef<Tab>("today");
  const scrollPositions = useRef<Partial<Record<Tab, number>>>({});
  const restoreScroll = useRef(0);

  useEffect(() => {
    setLang(readLocal<Lang>("ie.lang", "zh"));
    const id = readLocal<string | null>("ie.person", null);
    setPerson(people.find((x) => x.id === id) ?? null);
    const h = location.hash.slice(1) as Tab;
    if (TABS.some((x) => x.id === h)) { setTab(h); activeTab.current = h; }
    setMounted(true);
    if ("serviceWorker" in navigator && location.hostname !== "localhost") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  const go = useCallback((next: Tab, day?: number) => {
    if (activeTab.current === next && day === undefined) return;
    scrollPositions.current[activeTab.current] = window.scrollY;
    restoreScroll.current = day === undefined ? scrollPositions.current[next] ?? 0 : 0;
    activeTab.current = next;
    setTab(next);
    setJump(day);
    history.replaceState(null, "", `#${next}`);
  }, []);

  useLayoutEffect(() => {
    if (mounted) window.scrollTo({ top: restoreScroll.current, behavior: "instant" });
  }, [mounted, tab, jump]);

  useLayoutEffect(() => {
    const el = shell.current;
    if (!el) return;
    const header = el.querySelector<HTMLElement>(".app-header");
    const nav = el.querySelector<HTMLElement>(".app-bottom-nav");
    const measure = () => {
      el.style.setProperty("--app-header-height", `${header?.getBoundingClientRect().height ?? 65}px`);
      el.style.setProperty("--app-nav-height", `${nav?.getBoundingClientRect().height ?? 76}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (nav) observer.observe(nav);
    return () => observer.disconnect();
  }, [mounted]);

  const toggleLang = () => {
    const next = lang === "zh" ? "en" : "zh";
    setLang(next);
    writeLocal("ie.lang", next);
    document.documentElement.lang = next === "zh" ? "zh-Hans" : "en";
  };

  const pick = (p: Person) => {
    setPerson(p);
    writeLocal("ie.person", p.id);
    setPicking(false);
  };

  if (!mounted) return <div className="min-h-dvh bg-cream" />;

  return (
    <AppCtx.Provider value={{ lang, person, go }}>
      <ViewMemory>
        <div ref={shell} className="app-shell">
          {(!person || picking) && <WhoAreYou onPick={pick} onLang={toggleLang} />}
          <Header
            onLang={toggleLang}
            onSwitch={() => {
              setPirate(false);
              setPicking(true);
            }}
            onPirate={() => setPirate(true)}
            pirateTick={pirateTick}
          />
          {pirate && person && (
            <PirateSheet
              onLang={toggleLang}
              onClose={() => {
                setPirate(false);
                setPirateTick((n) => n + 1);
              }}
            />
          )}
          <main className={`mx-auto w-full max-w-md px-4 pt-3 ${tab === "map" ? "pb-0" : "pb-28"}`}>
            {tab === "today" && <TodayView jumpTo={jump} />}
            {tab === "trip" && <TripView />}
            {tab === "map" && <MapView />}
            {tab === "info" && <InfoView />}
            {tab === "tools" && <ToolsView />}
          </main>
          <BottomNav tab={tab} />
        </div>
      </ViewMemory>
    </AppCtx.Provider>
  );
}

function Header({ onLang, onSwitch, onPirate, pirateTick }: { onLang: () => void; onSwitch: () => void; onPirate: () => void; pirateTick: number }) {
  const { lang, person, t } = useApp();
  const drawReady = useDrawAvailable(person?.id ?? null, pirateTick);
  return (
    <header className="app-header pt-safe sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☘️</span>
          <span className="app-brand font-bold">{lang === "zh" ? "爱尔兰之旅" : "Ireland Trip"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onLang}
            className="min-h-11 min-w-11 rounded-full border border-line bg-card px-3 text-[15px] font-bold"
            aria-label="language"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          {person && (
            <button onClick={onPirate} aria-label={t("pirate")} className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-[20px]">
              🏴‍☠️
              {drawReady && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-cream bg-red-500" />}
            </button>
          )}
          {person && (
            <button onClick={onSwitch} aria-label={t("change")} className="grid size-11 place-items-center rounded-full">
              <Avatar person={person} size={40} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tab }: { tab: Tab }) {
  const { t, go } = useApp();
  return (
    <nav className="app-bottom-nav pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ id, icon: Icon }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              aria-label={t(id === "tools" ? "checklist" : id)}
              aria-current={on ? "page" : undefined}
              onClick={() => go(id)}
              className={`grid min-h-14 place-items-center py-1.5 ${on ? "text-shamrock" : "text-sub"}`}
            >
              <span className={`grid h-11 w-14 place-items-center rounded-full ${on ? "bg-shamrock-soft" : ""}`}>
                <Icon size={24} strokeWidth={on ? 2.5 : 2} aria-hidden="true" />
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

