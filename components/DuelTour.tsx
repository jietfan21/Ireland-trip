"use client";

import { useState } from "react";
import { DUEL_ICONS } from "@/lib/duel";
import { useApp } from "./common";

type Props = { onFinish: () => void; practice: boolean };

export default function DuelTour({ onFinish, practice }: Props) {
  const { lang } = useApp();
  const say = (zh: string, en: string) => lang === "zh" ? zh : en;
  const [step, setStep] = useState(0);
  const titles = [say("五岛夺宝", "Five islands"), say("12枚炮弹，逐回合选择", "12 shots, one round at a time"), say("加入、准备、开战", "Join. Ready. Battle.")];
  const lines = [
    say("炮弹多，就拿下该岛分数。", "More shots wins that island’s points."),
    say("总共12枚，每回合自由决定用几枚。", "12 shots total. Choose how many each round."),
    say("双方锁定后揭晓，每回合可等24小时。", "Both lock, then reveal. 24 hours per round."),
  ];
  return (
    <div className="duel-tour">
      <div className="duel-tour-progress" aria-label={say(`第${step + 1}步，共3步`, `Step ${step + 1} of 3`)}>
        {[0, 1, 2].map(n => <span key={n} className={n === step ? "current" : ""} aria-hidden="true" />)}
      </div>
      <div className="duel-tour-visual" aria-hidden="true">
        {step === 2 ? <div className="duel-tour-locks"><span>🔒</span><b>⚔️</b><span>🔒</span></div> :
          <div className="duel-tour-islands">{DUEL_ICONS.map((icon, i) => <div key={i}><span>{icon}</span><strong>{step === 0 ? i + 1 : [0, 1, 2, 3, 6][i]}</strong><small>{step === 0 ? say("分", "pts") : "💣"}</small></div>)}</div>}
      </div>
      <div className="duel-tour-copy" aria-live="polite">
        <h3>{titles[step]}</h3>
        <p>{lines[step]}</p>
        {step === 2 && <small>{practice ? say("练习不扣金币", "Practice uses no gold") : say("超时自动出招 · 总分高者赢", "Timeout: automatic shots · Highest score wins")}</small>}
      </div>
      <div className="duel-tour-actions">
        <button className="pirate-secondary-button" onClick={step === 0 ? onFinish : () => setStep(n => n - 1)}>{step === 0 ? say("跳过", "Skip") : say("上一步", "Back")}</button>
        <button className="pirate-gold-button" onClick={step === 2 ? onFinish : () => setStep(n => n + 1)}>{step === 2 ? say("开始对决", "Let’s play") : say("下一步", "Next")} →</button>
      </div>
    </div>
  );
}
