"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import { ChevronLeft, ChevronRight, Mountain, Pause, Play, Satellite, X } from "lucide-react";
import { days, navUrl, places, stayById, stayNavUrl, type Day, type L } from "@/lib/trip";
import { cachedRoute, fetchRoute, type LngLat } from "@/lib/routes";
import { NavButton, useApp } from "./common";
import FullDayNavigation from "./FullDayNavigation";
import { useViewRef, useViewState } from "./ViewMemory";

type Pt = { id: string; lng: number; lat: number; name: L; nav: string; stay: boolean };
type Camera = { center: [number, number]; zoom: number; pitch: number; bearing: number };

function resolve(id: string): Pt | null {
  if (id.startsWith("@")) {
    const s = stayById(id.slice(1));
    return s ? { id, lng: s.lng, lat: s.lat, name: s.town, nav: stayNavUrl(s), stay: true } : null;
  }
  const p = places[id];
  return p ? { id, lng: p.lng, lat: p.lat, name: p, nav: navUrl(p.lat, p.lng, p.q), stay: false } : null;
}

const tripDays = days.filter((d) => d.stops.length > 0);
const dayPts = (d: Day) => d.stops.map(resolve).filter((p): p is Pt => !!p);
const dayStops = (d: Day): LngLat[] => dayPts(d).map((p) => [p.lng, p.lat]);

// Whole-trip view: one marker per stay, labelled with the day(s) we drive in to it.
// Stays a few km apart (Croke Park / Clayton hotels) share one marker so badges don't overlap.
const arrivals = (() => {
  const out: { pt: Pt; days: number[]; towns: L[] }[] = [];
  let prev: string | undefined;
  for (const d of days) {
    if (d.stay && d.stay !== prev) {
      const pt = resolve(`@${d.stay}`);
      if (pt) {
        const near = out.find((a) => Math.hypot(a.pt.lng - pt.lng, a.pt.lat - pt.lat) < 0.15);
        if (!near) out.push({ pt, days: [d.n], towns: [pt.name] });
        else {
          near.days.push(d.n);
          if (!near.towns.some((x) => x.en === pt.name.en)) near.towns.push(pt.name);
        }
      }
    }
    prev = d.stay ?? prev;
  }
  return out;
})();

// Free, keyless raster sources; the service worker caches their tiles for offline use.
const SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function MapView() {
  const { lang, t, p } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const dayStrip = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<MLMarker[]>([]);
  const lib = useRef<typeof import("maplibre-gl") | null>(null);
  const tour = useRef(0);
  const [sel, setSel] = useViewState<number | null>("map.day", null);
  const [ready, setReady] = useState(false);
  const [routes, setRoutes] = useState(() => tripDays.map((d) => ({ coords: dayStops(d), road: false })));
  const [sat, setSat] = useViewState("map.satellite", false);
  const [three, setThree] = useViewState("map.terrain", false);
  const [card, setCard] = useViewState<number | null>("map.card", null);
  const [touring, setTouring] = useState(false);
  const camera = useViewRef<Camera | null>("map.camera", null);
  const framed = useViewRef<{ day: number | null } | null>("map.framed", null);
  const lastCard = useViewRef<number | null>("map.lastCard", null);
  const lastTerrain = useViewRef("map.lastTerrain", three);

  const selectDay = (next: number | null) => {
    if (next === sel) return;
    setSel(next);
    setCard(null);
    lastCard.current = null;
    camera.current = null;
  };

  const day = sel == null ? null : tripDays[sel];
  const pts = day ? dayPts(day) : [];

  useLayoutEffect(() => {
    dayStrip.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "instant" });
  }, [sel]);

  // Cached routes first (instant, offline), then fill in any missing ones from OSRM.
  useEffect(() => {
    setRoutes(tripDays.map((d) => cachedRoute(dayStops(d))));
    let live = true;
    (async () => {
      for (let i = 0; i < tripDays.length; i++) {
        const r = await fetchRoute(dayStops(tripDays[i]));
        if (!live) return;
        if (r.road) setRoutes((rs) => rs.map((x, j) => (j === i ? r : x)));
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !box.current) return;
      lib.current = ml;
      // Copied into /public by the prebuild script; the bundler can't resolve maplibre's own worker path.
      ml.setWorkerUrl(new URL("/maplibre-gl-worker.mjs", location.href).href);
      const m = new ml.Map({
        container: box.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: camera.current?.center ?? [-8, 53.4],
        zoom: camera.current?.zoom ?? 5.6,
        pitch: camera.current?.pitch ?? (three ? 60 : 0),
        bearing: camera.current?.bearing ?? 0,
        maxPitch: 70,
        attributionControl: false,
      });
      m.addControl(new ml.AttributionControl({ compact: true, customAttribution: "Esri · AWS Terrain · OSRM" }), "bottom-right");
      m.addControl(new ml.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
      m.addControl(new ml.GeolocateControl({ trackUserLocation: true }), "top-right");
      m.on("load", () => {
        const firstSymbol = m.getStyle().layers.find((l) => l.type === "symbol")?.id;
        m.addSource("sat", { type: "raster", tiles: [SAT], tileSize: 256, maxzoom: 18 });
        m.addLayer({ id: "sat", type: "raster", source: "sat", layout: { visibility: "none" } }, firstSymbol);
        // Separate DEM sources for shading and 3D, as maplibre recommends.
        const dem = { type: "raster-dem" as const, tiles: [DEM], tileSize: 256, maxzoom: 14, encoding: "terrarium" as const };
        m.addSource("dem-shade", dem);
        m.addSource("dem-3d", dem);
        m.addLayer(
          { id: "hillshade", type: "hillshade", source: "dem-shade", paint: { "hillshade-exaggeration": 0.35, "hillshade-shadow-color": "#2d3b36" } },
          firstSymbol,
        );
        m.addSource("routes", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({
          id: "routes-casing",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#fff", "line-width": ["case", ["==", ["get", "on"], 1], 8, 0], "line-opacity": 0.9 },
        });
        m.addLayer({
          id: "routes",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["==", ["get", "on"], 1], 5, 2],
            "line-opacity": ["case", ["==", ["get", "on"], 1], 0.95, 0.3],
          },
        });
        // The compact attribution box starts expanded; keep it folded to the (i) button.
        const attrib = box.current?.querySelector(".maplibregl-ctrl-attrib");
        attrib?.classList.remove("maplibregl-compact-show");
        attrib?.removeAttribute("open");
        setReady(true);
      });
      // Any manual pan/zoom stops the fly-through.
      m.on("dragstart", () => {
        tour.current++;
        setTouring(false);
      });
      map.current = m;
      resize = new ResizeObserver(() => m.resize());
      resize.observe(box.current);
    });
    return () => {
      cancelled = true;
      tour.current++;
      resize?.disconnect();
      const m = map.current;
      if (m) {
        const center = m.getCenter();
        camera.current = { center: [center.lng, center.lat], zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() };
      }
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Route lines.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    (m.getSource("routes") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: tripDays.map((d, i) => ({
        type: "Feature",
        properties: { color: d.color, on: sel == null || sel === i ? 1 : 0 },
        geometry: { type: "LineString", coordinates: routes[i].coords },
      })),
    });
  }, [ready, routes, sel]);

  // Satellite + 3D toggles.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.setLayoutProperty("sat", "visibility", sat ? "visible" : "none");
  }, [ready, sat]);

  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    m.setTerrain(three ? { source: "dem-3d", exaggeration: 1.5 } : null);
    if (lastTerrain.current !== three) m.easeTo({ pitch: three ? 60 : 0, duration: 800 });
    lastTerrain.current = three;
  }, [ready, three]);

  // Markers + framing whenever the selected day changes.
  useEffect(() => {
    const m = map.current;
    const ml = lib.current;
    if (!ready || !m || !ml) return;
    tour.current++;
    setTouring(false);
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    const bounds = new ml.LngLatBounds();
    const add = (el: HTMLElement, pt: Pt) => {
      bounds.extend([pt.lng, pt.lat]);
      const mk = new ml.Marker({ element: el }).setLngLat([pt.lng, pt.lat]).addTo(m);
      markers.current.push(mk);
      return mk;
    };

    if (!day) {
      for (const { pt, days: ns, towns } of arrivals) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", towns.map((x) => x[lang]).join(" / "));
        el.innerHTML = `<span style="font-size:15px">🛏</span><b>${ns.join("·")}</b>`;
        el.style.cssText =
          "display:flex;align-items:center;gap:3px;min-height:44px;min-width:44px;font:700 13px system-ui;color:#17322d;padding:3px 8px 3px 6px;border-radius:999px;background:#fff;border:2px solid #17322d;box-shadow:0 2px 6px #0004;cursor:pointer";
        add(el, pt).setPopup(
          new ml.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="font-size:16px;font-weight:700;margin-bottom:2px">${esc(towns.map((x) => x[lang]).join(" / "))}</div>` +
              `<div style="color:#5d716c;margin-bottom:8px">${esc(ns.map((n) => t("day", { n })).join(" · "))}</div>` +
              `<a href="${pt.nav}" target="_blank" rel="noreferrer" style="display:inline-block;background:#1f7a5a;color:#fff;border-radius:12px;padding:8px 14px;font-weight:700;text-decoration:none">➤ ${esc(t("navigate"))}</a>`,
          ),
        );
      }
    } else {
      let num = 0;
      pts.forEach((pt, i) => {
        // A stay that starts and ends the day only gets one marker.
        if (pts.findIndex((q) => q.id === pt.id) !== i) return;
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", p(pt.name));
        if (pt.stay) {
          el.textContent = "🛏";
          el.style.cssText = "font-size:18px;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:#fff;border:3px solid #17322d;box-shadow:0 2px 6px #0004";
        } else {
          el.textContent = String(++num);
          el.style.cssText = `font:700 14px system-ui;color:#fff;width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:${day.color};border:2px solid #fff;box-shadow:0 2px 6px #0004`;
        }
        el.onclick = (e) => {
          e.stopPropagation();
          tour.current++;
          setTouring(false);
          setCard(i);
        };
        add(el, pt);
      });
    }
    if (!bounds.isEmpty() && (!framed.current || framed.current.day !== sel)) {
      m.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 50, right: 60 }, maxZoom: 12, duration: 600 });
      framed.current = { day: sel };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, ready, lang]);

  // Fly to the stop whose card is open.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || card === lastCard.current) return;
    lastCard.current = card;
    if (card == null || !pts[card]) return;
    const pt = pts[card];
    m.flyTo({ center: [pt.lng, pt.lat], zoom: 13.5, offset: [0, -80], pitch: three ? 60 : 0, bearing: three ? m.getBearing() : 0, duration: 2200, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, card]);

  async function playTour() {
    if (touring) {
      tour.current++;
      setTouring(false);
      return;
    }
    if (!day) return;
    const run = ++tour.current;
    setTouring(true);
    for (let i = 0; i < pts.length; i++) {
      if (tour.current !== run) return;
      setCard(i);
      await new Promise((r) => setTimeout(r, 4200));
    }
    if (tour.current === run) setTouring(false);
  }

  const cardPt = card == null ? null : pts[card];
  const cardStep = cardPt && day?.steps.find((s) => s.place === cardPt.id);
  const cardStay = cardPt?.stay ? stayById(cardPt.id.slice(1)) : undefined;
  const toggle = (on: boolean) => (on ? "bg-ink text-white" : "bg-white/95 text-ink");

  return (
    <div className="app-map-view -mx-4 flex min-h-0 flex-col">
      <div ref={dayStrip} className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => selectDay(null)}
          aria-pressed={sel == null}
          className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-[15px] font-bold ${sel == null ? "bg-ink text-white" : "border border-line bg-card"}`}
        >
          {t("whole")}
        </button>
        {tripDays.map((d, i) => (
          <button
            key={d.n}
            onClick={() => selectDay(i)}
            aria-pressed={sel === i}
            className="min-h-11 shrink-0 rounded-full px-4 py-2 text-[15px] font-bold"
            style={sel === i ? { background: d.color, color: "#fff" } : { background: "#fff", border: "1px solid #e3ddd0" }}
          >
            {t("day", { n: d.n })}
          </button>
        ))}
      </div>
      {day && (
        <p className="shrink-0 px-4 pb-2 text-[15px] font-semibold">
          {p(day.title)} <span className="font-normal text-sub">· {p(day.route)}</span>
        </p>
      )}
      {day && <div className="shrink-0 px-4 pb-2"><FullDayNavigation key={day.date} day={day} compact /></div>}
      <div className="relative isolate min-h-0 flex-1 overflow-hidden rounded-t-3xl border-t border-line">
        {/* Inline positioning: maplibre's stylesheet would override a utility class here and collapse the height. */}
        <div ref={box} style={{ position: "absolute", inset: 0 }} />

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <button onClick={() => setSat((v) => !v)} aria-pressed={sat} className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold shadow ${toggle(sat)}`}>
            <Satellite size={16} />
            {t("satellite")}
          </button>
          <button onClick={() => setThree((v) => !v)} aria-pressed={three} className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold shadow ${toggle(three)}`}>
            <Mountain size={16} />
            3D
          </button>
          {day && (
            <button onClick={playTour} aria-pressed={touring} className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold shadow ${toggle(touring)}`}>
              {touring ? <Pause size={16} /> : <Play size={16} />}
              {t("flyThrough")}
            </button>
          )}
        </div>

        {day && !routes[sel!].road && <p className="absolute top-3 right-14 z-10 rounded-full bg-white/90 px-3 py-1 text-xs text-sub shadow">{t("straightLines")}</p>}

        {cardPt && day && (
          <div className="absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%_-_24px)] overflow-y-auto rounded-3xl border border-line bg-card p-4 shadow-[0_8px_24px_#17322d33]">
            <div className="flex items-start gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full text-base font-bold text-white"
                style={{ background: cardPt.stay ? "#17322d" : day.color }}
              >
                {cardPt.stay ? "🛏" : pts.slice(0, card! + 1).filter((q, i) => !q.stay && pts.findIndex((r) => r.id === q.id) === i).length}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-tight font-bold">{p(cardPt.name)}</p>
                {cardStep && (
                  <p className="mt-1 text-[15px] text-sub">
                    {cardStep.t && <b className="mr-1 text-ink">{cardStep.t === "eve" ? t("eve") : cardStep.t}</b>}
                    {p(cardStep.text)}
                  </p>
                )}
                {cardStay && (
                  <p className="mt-1 text-[15px] text-sub">
                    {cardStay.name} · {t("checkIn")} {cardStay.checkIn}
                  </p>
                )}
              </div>
              <button onClick={() => { tour.current++; setTouring(false); setCard(null); }} className="-m-1 grid size-11 shrink-0 place-items-center rounded-full text-sub" aria-label="close">
                <X size={22} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                disabled={card === 0}
                onClick={() => setCard((c) => Math.max(0, c! - 1))}
                className="grid size-11 place-items-center rounded-2xl border border-line disabled:opacity-30"
                aria-label="previous"
              >
                <ChevronLeft size={22} />
              </button>
              <NavButton href={cardPt.nav} label={t("navigate")} big />
              <button
                disabled={card === pts.length - 1}
                onClick={() => setCard((c) => Math.min(pts.length - 1, c! + 1))}
                className="grid size-11 place-items-center rounded-2xl border border-line disabled:opacity-30"
                aria-label="next"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

