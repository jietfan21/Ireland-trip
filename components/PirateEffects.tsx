"use client";

import type { CSSProperties } from "react";
import type { Person } from "@/lib/trip";
import { Avatar, useApp } from "./common";

export type PirateEffect = { kind: "bomb" | "steal" | "shield" | "spins" | "blocked" | "mirror"; target?: Person; amount: number; shieldFull?: boolean };

function Token({ kind }: { kind: PirateEffect["kind"] }) {
  return <svg viewBox="0 0 160 160" aria-hidden="true" className="pirate-effect-token">
    {kind === "bomb" ? <>
      <path d="M103 49 Q98 21 124 27 Q143 32 132 13" fill="none" stroke="#efba58" strokeWidth="6" strokeLinecap="round" className="pirate-fuse" />
      <path d="M130 4L134 12L144 10L137 18L143 26L132 23L125 31L127 20L117 15L128 13Z" fill="#ffdf81" className="pirate-fuse-spark" />
      <path d="M87 42L107 51L99 68L78 57Z" fill="#e6b75d" stroke="#724525" strokeWidth="3" />
      <circle cx="76" cy="99" r="47" fill="#142b39" stroke="#e7bd6a" strokeWidth="4" />
      <path d="M44 93Q44 69 67 67" stroke="#7e9da2" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M87 119L96 125L105 116" stroke="#0b1725" strokeWidth="5" fill="none" />
    </> : kind === "steal" ? <>
      <path d="M61 39L49 18L73 24L82 15L94 25L114 20L100 43Z" fill="#e9b44e" stroke="#fff0af" strokeWidth="3" />
      <path d="M60 45Q38 64 30 100Q22 143 80 145Q138 143 130 100Q122 65 100 45Z" fill="#d4a03f" stroke="#ffe4a1" strokeWidth="4" />
      <path d="M56 46L103 46" stroke="#694321" strokeWidth="9" strokeLinecap="round" />
      <path d="M46 103Q43 77 59 65" fill="none" stroke="#f8d67c" strokeWidth="7" strokeLinecap="round" />
      <circle cx="83" cy="101" r="23" fill="#f7d87d" stroke="#a56d2b" strokeWidth="3" />
      <path d="M83 84V118M95 88H78Q66 98 83 101Q102 105 89 114H72" fill="none" stroke="#96652b" strokeWidth="5" strokeLinecap="round" />
    </> : kind === "shield" || kind === "blocked" ? <>
      <path d="M80 13L135 37L127 96Q117 128 80 147Q43 128 33 96L25 37Z" fill="#e9c77d" stroke="#fff1ba" strokeWidth="3" />
      <path d="M80 26L121 45L114 92Q106 116 80 132Q54 116 46 92L39 45Z" fill="#25788c" stroke="#123f57" strokeWidth="4" />
      <path d="M80 29V129Q107 113 114 92L121 45Z" fill="#165268" />
      <path d="M63 63Q47 47 60 41Q78 34 80 59Q83 34 101 41Q114 47 98 63Q123 63 116 81Q109 94 89 75L85 103H75L71 75Q51 94 44 81Q37 63 63 63Z" fill="#bde8c7" transform="translate(10 14) scale(.87)" />
    </> : kind === "mirror" ? <>
      <path d="M76 118L67 150H93L84 118" fill="#c2a2d5" stroke="#ffe8b4" strokeWidth="3" />
      <ellipse cx="80" cy="68" rx="49" ry="58" fill="#a990bc" stroke="#fff0be" strokeWidth="5" />
      <ellipse cx="80" cy="68" rx="39" ry="48" fill="#b5e5ee" stroke="#695684" strokeWidth="3" />
      <path d="M60 94L90 37M76 104L104 52" stroke="#fff" strokeWidth="10" opacity=".7" />
      <path d="M41 65L25 61L31 47M117 78L135 81L130 96" fill="none" stroke="#fff0a5" strokeWidth="5" strokeLinecap="round" />
    </> : <>
      <circle cx="80" cy="80" r="58" fill="#eabb58" stroke="#fff0ae" strokeWidth="5" />
      <circle cx="80" cy="80" r="46" fill="#247b78" stroke="#ae7730" strokeWidth="3" />
      <path d="M58 94A29 29 0 1 0 62 56" fill="none" stroke="#fff0c2" strokeWidth="9" strokeLinecap="round" />
      <path d="M48 47L47 73L72 65Z" fill="#fff0c2" />
    </>}
  </svg>;
}

export default function PirateEffects({ effect }: { effect: PirateEffect }) {
  const { lang, p } = useApp();
  const say = (zh: string, en: string) => lang === "zh" ? zh : en;
  const titles = {
    bomb: say("炸弹命中！", "BOMBS AWAY!"), steal: say("宝藏到手！", "TREASURE RAID!"),
    shield: effect.shieldFull ? say("盾牌已满 · 换金币", "SHIELDS FULL · GOLD INSTEAD") : say("盾牌就位！", "SHIELD UP!"),
    spins: say("再来三次！", "KEEP IT SPINNING!"), blocked: say("被盾牌挡住了", "SHIELD BLOCK!"), mirror: say("镜子反弹！", "BOUNCED BACK!"),
  };
  const value = effect.kind === "spins" ? "+3" : effect.kind === "shield" && !effect.shieldFull ? "+1" : effect.amount > 0 ? `${effect.kind === "bomb" || effect.kind === "mirror" ? "−" : "+"}${effect.amount.toLocaleString()}` : "";
  return <div className={`pirate-effect pirate-effect-${effect.kind}`} role="img" aria-label={`${titles[effect.kind]} ${effect.target ? p(effect.target) : ""} ${value}`}>
    <div className="pirate-effect-art" aria-hidden="true">
      <div className="pirate-effect-aura" />
      <div className="pirate-effect-ring" />
      <div className="pirate-effect-main-token"><Token kind={effect.kind} /></div>
      {(effect.kind === "bomb" || effect.kind === "blocked") && <span className="pirate-bomb-flash" />}
      {effect.kind === "bomb" && Array.from({ length: 10 }, (_, i) => <i className="pirate-blast-particle" key={i} style={{ "--particle-x": `${Math.cos(i * Math.PI / 5) * 90}px`, "--particle-y": `${Math.sin(i * Math.PI / 5) * 75}px`, animationDelay: `${420 + i % 3 * 30}ms` } as CSSProperties} />)}
      {effect.kind === "steal" && Array.from({ length: 5 }, (_, i) => <span className="pirate-stolen-coin" key={i} style={{ animationDelay: `${i * 110}ms` }}>🪙</span>)}
      {(effect.kind === "shield" || effect.kind === "blocked") && <span className="pirate-shield-shine" />}
      {effect.kind === "blocked" && <div className="pirate-block-projectile"><Token kind="bomb" /></div>}
      {effect.kind === "mirror" && <span className="pirate-reflect-trail">↶</span>}
      {effect.kind === "spins" && [-1, 0, 1].map((n) => <span key={n} className="pirate-spin-token" style={{ "--token-x": `${n * 62}px`, "--token-tilt": `${n * 20}deg`, animationDelay: `${(n + 1) * 80}ms` } as CSSProperties}><Token kind="spins" /></span>)}
      {value && <strong className="pirate-effect-number">{value}</strong>}
    </div>
    <div className="pirate-effect-caption" aria-hidden="true"><strong>{titles[effect.kind]}</strong>{effect.target && <span><Avatar person={effect.target} size={25} />{p(effect.target)}</span>}</div>
  </div>;
}
