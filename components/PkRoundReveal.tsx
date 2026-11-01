"use client";
import {useEffect,useState} from "react";
import {DUEL_ICONS,type DuelMatch,type PkRound} from "@/lib/duel";
import {people} from "@/lib/trip";
import {useApp} from "./common";
import {Ship} from "./DuelReveal";
import {pkRoundPoints,pkScoreAt} from "@/lib/pk";
import PkScoreboard from "./PkScoreboard";
export default function PkRoundReveal({match:m,round:r,onNext}:{match:DuelMatch;round:PkRound;onNext:()=>void}){
 const {lang,p}=useApp(),say=(zh:string,en:string)=>lang==="zh"?zh:en;
 const [phase,setPhase]=useState("intro");
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){setPhase('result');return;}let fire:ReturnType<typeof setTimeout>,result:ReturnType<typeof setTimeout>;fire=setTimeout(()=>setPhase(p=>p==='intro'?'fire':p),650);result=setTimeout(()=>setPhase('result'),1600);return()=>{clearTimeout(fire);clearTimeout(result);};},[]);
 const name=(id:string)=>id==="bot"?say("练习船长","Captain Bot"):p(people.find(x=>x.id===id)??{zh:id,en:id});
 const winner=r.a>r.b?m.a:r.b>r.a?m.b:null;
 const scored=phase==='result',[scoreA,scoreB]=pkScoreAt(m.rounds??[],scored?r.n:r.n-1),[awardA,awardB]=pkRoundPoints(r);
 return <section className="duel-cinema" aria-label={say("回合揭晓","Round reveal")}>
  <PkScoreboard a={m.a} b={m.b} scoreA={scoreA} scoreB={scoreB} round={r.n} awardA={scored?awardA:0} awardB={scored?awardB:0}/>
  <div className="duel-round-heading"><h2>{DUEL_ICONS[r.n-1]} · {r.n} {say("分","points")}</h2></div>
  <div className={`duel-sea-stage phase-${phase}`}>
   <div className="duel-sea-ripple ripple-one"/><div className="duel-sea-ripple ripple-two"/>
   <Ship id={m.a} side="left" firing={phase==='fire'}/><Ship id={m.b} side="right" firing={phase==='fire'}/>
   <div className="duel-shot-count shot-a">{phase==='intro'?'?':r.a}<small>💣</small></div><div className="duel-shot-count shot-b">{phase==='intro'?'?':r.b}<small>💣</small></div>
   <div className="duel-cinema-island"><span>{DUEL_ICONS[r.n-1]}</span><small>{r.n} {say("分","pts")}</small>{phase==='result'&&winner&&<i className={`duel-island-flag ${winner===m.a?'flag-a':'flag-b'}`}>⚑</i>}</div>
   {phase==='fire'&&<svg className="duel-cannon-trails" viewBox="0 0 360 240" aria-hidden="true"><circle r="5" fill="#ffe2a0"><animateMotion dur=".85s" fill="freeze" path="M90 105 Q130 40 175 183"/></circle><circle r="5" fill="#ffe2a0"><animateMotion dur=".85s" fill="freeze" path="M270 105 Q230 40 185 183"/></circle></svg>}
  </div>
  <div className="duel-round-result" role="status">{phase==='result'?<><strong>{winner?name(winner):say("本岛平局","Island tied")}</strong><span>{winner?`+${r.n} ${say("分","points")}`:say("双方 +0 分","No points")}</span></>:<span>{phase==='fire'?say("开炮！","Cannons away!"):say("双方准备…","Captains ready…")}</span>}</div>
  {(r.autoA||r.autoB)&&<p className="duel-caption">🤖 {say("超时自动出招","Automatic shots after timeout")}</p>}
  <button className="pirate-gold-button pk-continue" onClick={()=>phase==='result'?onNext():setPhase('result')}>{phase==='result'?r.n===5?say("查看战果","Final result"):say("下一回合","Next round"):say("直接揭晓","Reveal now")} →</button>
 </section>;
}
