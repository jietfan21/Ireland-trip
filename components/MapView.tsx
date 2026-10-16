"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, Marker as MLMarker } from "maplibre-gl";
import { days, navUrl, places, stayById, stayNavUrl, type Day } from "@/lib/trip";
import { useApp } from "./common";

type Pt = { lng: number; lat: number; label: string; nav: string; stay: boolean };

function resolve(id: string, lang: "zh" | "en"): Pt | null {
  if (id.startsWith("@")) {
    const s = stayById(id.slice(1));
    return s ? { lng: s.lng, lat: s.lat, label: `🛏 ${s.town[lang]}`, nav: stayNavUrl(s), stay: true } : null;
  }
  const p = places[id];
  return p ? { lng: p.lng, lat: p.lat, label: p[lang], nav: navUrl(p.lat, p.lng), stay: false } : null;
}

const tripDays = days.filter((d) => d.stops.length > 0);

function lineFeatures(selected: Day | null) {
  return {
    type: "FeatureCollection" as const,
    features: tripDays.map((d) => ({
      type: "Feature" as const,
      properties: { color: d.color, on: !selected || selected.n === d.n ? 1 : 0 },
      geometry: {
        type: "LineString" as const,
        coordinates: d.stops.map((s) => resolve(s, "en")).filter((p): p is Pt => !!p).map((p) => [p.lng, p.lat]),
      },
    })),
  };
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function MapView() {
  const { lang, t, p } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<MLMarker[]>([]);
  const lib = useRef<typeof import("maplibre-gl") | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !box.current) return;
      lib.current = ml;
      // Copied into /public by the prebuild script; the bundler can't resolve maplibre's own worker path.
      ml.setWorkerUrl(new URL("/maplibre-gl-worker.mjs", location.href).href);
      const m = new ml.Map({
        container: box.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-8, 53.4],
        zoom: 5.6,
        attributionControl: { compact: true },
      });
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      m.addControl(new ml.GeolocateControl({ trackUserLocation: true }), "top-right");
      m.on("load", () => {
        m.addSource("routes", { type: "geojson", data: lineFeatures(null) });
        m.addLayer({
          id: "routes",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["==", ["get", "on"], 1], 5, 2],
            "line-opacity": ["case", ["==", ["get", "on"], 1], 0.9, 0.25],
          },
        });
        setReady(true);
      });
      map.current = m;
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const ml = lib.current;
    if (!ready || !m || !ml) return;
    const day = sel == null ? null : tripDays[sel];
    (m.getSource("routes") as import("maplibre-gl").GeoJSONSource).setData(lineFeatures(day));

    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    const ids = day ? day.stops : Array.from(new Set(tripDays.flatMap((d) => d.stops.filter((s) => s.startsWith("@")))));
    const bounds = new ml.LngLatBounds();
    const seen = new Set<string>();
    let num = 0;
    ids.forEach((id) => {
      const pt = resolve(id, lang);
      if (!pt || seen.has(id)) return;
      seen.add(id);
      bounds.extend([pt.lng, pt.lat]);
      const el = document.createElement("div");
      if (pt.stay) {
        el.textContent = "🛏";
        el.style.cssText = "font-size:18px;width:34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#fff;border:3px solid #17322d;box-shadow:0 2px 6px #0004";
      } else {
        num += 1;
        el.textContent = String(num);
        el.style.cssText = `font:700 14px system-ui;color:#fff;width:28px;height:28px;display:grid;place-items:center;border-radius:50%;background:${day?.color ?? "#1f7a5a"};border:2px solid #fff;box-shadow:0 2px 6px #0004`;
      }
      const popup = new ml.Popup({ offset: 18, closeButton: false }).setHTML(
        `<div style="font-size:16px;font-weight:700;margin-bottom:8px">${esc(pt.label)}</div>` +
          `<a href="${pt.nav}" target="_blank" rel="noreferrer" style="display:inline-block;background:#1f7a5a;color:#fff;border-radius:12px;padding:8px 14px;font-weight:700;text-decoration:none">➤ ${esc(t("navigate"))}</a>`,
      );
      markers.current.push(new ml.Marker({ element: el }).setLngLat([pt.lng, pt.lat]).setPopup(popup).addTo(m));
    });
    if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 600 });
  }, [sel, ready, lang, t]);

  return (
    <div className="-mx-4 flex h-[calc(100dvh-140px)] flex-col">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => setSel(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-bold ${sel == null ? "bg-ink text-white" : "border border-line bg-card"}`}
        >
          {t("whole")}
        </button>
        {tripDays.map((d, i) => (
          <button
            key={d.n}
            onClick={() => setSel(i)}
            className="shrink-0 rounded-full px-4 py-2 text-[15px] font-bold"
            style={sel === i ? { background: d.color, color: "#fff" } : { background: "#fff", border: "1px solid #e3ddd0" }}
          >
            {t("day", { n: d.n })}
          </button>
        ))}
      </div>
      {sel != null && (
        <p className="px-4 pb-2 text-[15px] font-semibold">
          {p(tripDays[sel].title)} <span className="font-normal text-sub">· {p(tripDays[sel].route)}</span>
        </p>
      )}
      <div ref={box} className="min-h-0 flex-1 overflow-hidden rounded-t-3xl border-t border-line" />
    </div>
  );
}
