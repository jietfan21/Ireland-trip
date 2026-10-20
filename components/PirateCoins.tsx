"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { animatedGoldValue } from "@/lib/piratePresentation";

// Retarget from the last painted value if another balance update arrives mid-animation.
export function AnimatedGold({ value, from, reduced = false }: { value: number; from?: number; reduced?: boolean }) {
  const [display, setDisplay] = useState(reduced ? value : (from ?? value));
  const painted = useRef(reduced ? value : (from ?? value));
  useEffect(() => {
    const startValue = painted.current;
    if (reduced || startValue === value) {
      painted.current = value;
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - startTime) / 900);
      const next = animatedGoldValue(startValue, value, progress);
      painted.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return <><span aria-hidden="true" className="pirate-animated-number">{display.toLocaleString()}</span><span className="sr-only">{value.toLocaleString()}</span></>;
}

export function CoinCollection({ origin, destination, reduced }: {
  origin: RefObject<HTMLElement | null>; destination: RefObject<HTMLElement | null>; reduced: boolean;
}) {
  const [path, setPath] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  useLayoutEffect(() => {
    if (reduced || !origin.current || !destination.current) return;
    const from = origin.current.getBoundingClientRect(), to = destination.current.getBoundingClientRect();
    const x = from.left + from.width / 2, y = from.top + from.height / 2;
    setPath({ x, y, dx: to.left + to.width / 2 - x, dy: to.top + to.height / 2 - y });
    const timer = setTimeout(() => setPath(null), 1200);
    return () => clearTimeout(timer);
  }, [origin, destination, reduced]);
  if (!path || reduced) return null;
  return <div className="pirate-coin-collection" aria-hidden="true">
    {[-30, -18, -6, 8, 20, 32].map((spread, i) => <span key={i} style={{
      left: path.x, top: path.y, animationDelay: `${i * 55}ms`,
      "--coin-spread": `${spread}px`, "--coin-dx": `${path.dx}px`, "--coin-dy": `${path.dy}px`,
    } as CSSProperties}>🪙</span>)}
  </div>;
}
