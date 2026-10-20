"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { people } from "@/lib/trip";
import { coinValue, WEDGES } from "@/lib/pirate";
import { fittedWheelSize, nextWheelRotation } from "@/lib/piratePresentation";
import { useApp } from "./common";

const R = 160;
const point = (angle: number, radius: number) => [R + radius * Math.sin(angle * Math.PI / 180), R - radius * Math.cos(angle * Math.PI / 180)];

export default function PirateWheel({ rotation, duration, today, candidates, label }: {
  rotation: number; duration: number; today: string; candidates?: string[]; label: string;
}) {
  const { p } = useApp();
  const frame = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ size: 0, x: 0, y: 0 });
  useLayoutEffect(() => {
    const stage = frame.current?.parentElement;
    if (!stage) return;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      setBounds({ size: fittedWheelSize(rect.width, rect.height), x: rect.width / 2, y: rect.height / 2 });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const count = candidates?.length ?? WEDGES.length;
  // A single possible target still gets a full circular face.
  const faces = count === 1 && candidates ? [candidates[0], candidates[0]] : candidates;
  const segments = faces ?? WEDGES;
  const step = 360 / segments.length;
  return (
    <div ref={frame} className={`pirate-wheel-frame ${candidates ? "pirate-wheel-steal" : ""}`} role="img" aria-label={label} style={{ width: bounds.size, height: bounds.size, left: bounds.x, top: bounds.y, visibility: bounds.size > 0 ? "visible" : "hidden" }}>
      <div className="pirate-wheel-glow" />
      <div className="pirate-pointer" aria-hidden="true" />
      <div className="pirate-wheel-rim">
        <svg viewBox="0 0 320 320" className="pirate-wheel-disc" aria-hidden="true" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms` }}>
          {segments.map((segment, i) => {
            const start = i * step, end = start + step, mid = start + step / 2;
            const [x1, y1] = point(start, 156), [x2, y2] = point(end, 156);
            const [ex, ey] = point(mid, faces ? 94 : 86), [tx, ty] = point(mid, 128);
            const person = typeof segment === "string" ? people.find((x) => x.id === segment) : null;
            const w = typeof segment !== "string" ? segment : null;
            const colors = ["#146c60", "#132f40", "#226f91", "#9f6027", "#146c60", "#992f49", "#226f91", "#694293", "#146c60", "#226f91"];
            return (
              <g key={i}>
                <path d={`M160 160 L${x1} ${y1} A156 156 0 ${step > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={faces ? (i % 2 ? "#204e60" : "#1b776a") : colors[i]} stroke="#f9d987" strokeWidth="1.3" />
                {person ? (
                  <g transform={`rotate(${mid} ${ex} ${ey})`}>
                    <circle cx={ex} cy={ey} r="24" fill={person.color} stroke="#f9d987" strokeWidth="2" />
                    <text x={ex} y={ey + 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="800">{p(person).slice(0, 1)}</text>
                    <image href={`/avatars/${person.id}.webp`} x={ex - 27} y={ey - 30} width="54" height="54" />
                  </g>
                ) : w ? <text x={ex} y={ey} textAnchor="middle" dominantBaseline="central" fontSize="29" transform={`rotate(${mid} ${ex} ${ey})`}>{w.emoji}</text> : null}
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central" fontSize={faces ? "13" : "11"} fontWeight="850" fill="#fff4ce" transform={`rotate(${mid} ${tx} ${ty})`}>
                  {person ? p(person) : w?.kind === "win" ? coinValue(w.amount ?? 0, today).toLocaleString() : w ? p(w.label) : ""}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="pirate-wheel-hub" aria-hidden="true">{candidates ? "🏴‍☠️" : "☘️"}</div>
      </div>
      <div className="pirate-wheel-base" aria-hidden="true" />
    </div>
  );
}

export function StealWheel({ candidates, victim, duration, today, label }: {
  candidates: string[]; victim: string; duration: number; today: string; label: string;
}) {
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setRotation(nextWheelRotation(0, candidates.indexOf(victim), candidates.length === 1 ? 2 : candidates.length, 4)));
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [candidates, victim]);
  return <PirateWheel rotation={rotation} duration={duration} today={today} candidates={candidates} label={label} />;
}
