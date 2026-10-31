"use client";
import { useEffect, useReducer, useState, type CSSProperties } from "react";
import { DUEL_ICONS, type DuelMatch } from "@/lib/duel";
import { initialReveal, revealReducer } from "@/lib/duelReveal";
import { people } from "@/lib/trip";
import { Avatar, useApp } from "./common";
const NAMES=[{zh:"贝壳海滩",en:"Shell Shore"},{zh:"棕榈岛",en:"Palm Haven"},{zh:"珊瑚湾",en:"Coral Cove"},{zh:"骷髅礁",en:"Skull Rock"},{zh:"皇冠岛",en:"Crown Island"}];
function Ship({id,side,firing}:{id:string;side:"left"|"right";firing:boolean}) {
 const captain=people.find(x=>x.id===id);
 return <div className={`duel-ship duel-ship-${side} ${firing?"is-firing":""}`}>
  <svg viewBox="0 0 150 145" aria-hidden="true"><path d="M75 12V112" stroke="#d5b56e" strokeWidth="4"/><path d="M69 21L25 88H69Z" fill="#f7e4b0"/><path d="M82 30L119 88H82Z" fill="#d7c58f"/><path d="M16 106Q74 127 137 105L119 132Q75 148 34 130Z" fill="#6e442a" stroke="#cda35b" strokeWidth="3"/><path d="M30 117H125" stroke="#d0a05c" strokeWidth="3"/><circle cx="55" cy="126" r="4" fill="#112f32"/><circle cx="76" cy="130" r="4" fill="#112f32"/><circle cx="96" cy="127" r="4" fill="#112f32"/><path d="M20 141Q65 131 137 141" stroke="#a5e3dc" strokeOpacity=".5" strokeWidth="3" fill="none"/></svg>
  <div className="duel-ship-captain">{captain?<Avatar person={captain} size={39}/>:<span>🤖</span>}</div>
 </div>;
}
export default function DuelReveal({match:c,onDone}:{match:DuelMatch;onDone:()=>void}){
 const {lang,person,p}=useApp(),say=(zh:string,en:string)=>lang==="zh"?zh:en;
 const [frame,dispatch]=useReducer(revealReducer,initialReveal);
 const [reduced,setReduced]=useState(false),[visible,setVisible]=useState(true);
 useEffect(()=>{const mq=matchMedia("(prefers-reduced-motion: reduce)");const change=()=>{setReduced(mq.matches);if(mq.matches)dispatch({type:"reduce"});};change();mq.addEventListener("change",change);const visibility=()=>setVisible(!document.hidden);visibility();document.addEventListener("visibilitychange",visibility);return()=>{mq.removeEventListener("change",change);document.removeEventListener("visibilitychange",visibility);};},[]);
 useEffect(()=>{
  if(reduced){if(frame.phase!=="final"&&frame.phase!=="result")dispatch({type:"reduce"});return;}
  if(!visible||frame.phase==="final")return;
  const timer=setTimeout(()=>dispatch({type:"tick",round:frame.round,phase:frame.phase}),frame.phase==="intro"?700:frame.phase==="fire"?950:1250);
  return()=>clearTimeout(timer);
 },[frame,reduced,visible]);
 const name=(id:string)=>id==="bot"?say("练习船长","Captain Bot"):p(people.find(x=>x.id===id)??{zh:id,en:id});
 const ap=c.aPlan??[],bp=c.bPlan??[],final=frame.phase==="final",showShots=frame.phase!=="intro",scored=frame.phase==="result";
 const completed=final?5:frame.round+(scored?1:0);let sa=0,sb=0;
 for(let i=0;i<completed;i++){if(ap[i]>bp[i])sa+=i+1;else if(bp[i]>ap[i])sb+=i+1;}
 if(final){sa=c.aScore??sa;sb=c.bScore??sb;}
 const roundWinner=ap[frame.round]>bp[frame.round]?c.a:bp[frame.round]>ap[frame.round]?c.b:null;
 const won=c.winner===person?.id,winningPerson=people.find(x=>x.id===c.winner);
 return <section className="duel-cinema" aria-label={say("对决揭晓","Duel reveal")}>
  <div className="duel-cinema-score"><div><span>{name(c.a)}</span><strong key={`a-${sa}`}>{sa}</strong></div><b>⚔️</b><div><span>{name(c.b)}</span><strong key={`b-${sb}`}>{sb}</strong></div></div>
  {!final?<>
   <div className="duel-round-heading"><small>{say("第","ROUND")} {frame.round+1} / 5</small><h2>{p(NAMES[frame.round])}</h2></div>
   <div className={`duel-sea-stage phase-${frame.phase}`} key={frame.round}>
    <div className="duel-sea-ripple ripple-one"/><div className="duel-sea-ripple ripple-two"/>
    <Ship id={c.a} side="left" firing={frame.phase==="fire"}/><Ship id={c.b} side="right" firing={frame.phase==="fire"}/>
    <div className="duel-shot-count shot-a">{showShots?ap[frame.round]:"?"}<small>💣</small></div><div className="duel-shot-count shot-b">{showShots?bp[frame.round]:"?"}<small>💣</small></div>
    <div className="duel-cinema-island"><span>{DUEL_ICONS[frame.round]}</span><small>{frame.round+1} {say("分","pts")}</small>{scored&&roundWinner&&<i className={`duel-island-flag ${roundWinner===c.a?"flag-a":"flag-b"}`}>⚑</i>}</div>
    {frame.phase==="fire"&&<svg className="duel-cannon-trails" viewBox="0 0 360 240" aria-hidden="true"><circle r="5" fill="#ffe2a0"><animateMotion dur=".85s" fill="freeze" path="M90 105 Q130 40 175 183"/></circle><circle r="5" fill="#ffe2a0"><animateMotion dur=".85s" fill="freeze" path="M270 105 Q230 40 185 183"/></circle></svg>}
    {scored&&<div className="duel-water-splash" aria-hidden="true">✧</div>}
   </div>
   <div className="duel-round-result" role="status" aria-live="polite">{scored?<><strong>{roundWinner?name(roundWinner):say("本岛平局","Island tied")}</strong><span>{roundWinner?`+${frame.round+1} ${say("分","points")}`:say("双方 +0 分","No points awarded")}</span></>:<span>{frame.phase==="fire"?say("开炮！","Cannons away!"):say("双方准备…","Captains ready…")}</span>}</div>
   <div className="duel-round-track" aria-label={say("已揭晓岛屿","Islands revealed")}>{DUEL_ICONS.map((icon,i)=><span key={i} className={i<completed?"done":i===frame.round?"current":""}>{i<=frame.round?icon:"·"}</span>)}</div>
   <div className="duel-reveal-controls"><button className="pirate-secondary-button" onClick={()=>dispatch({type:"skip"})}>{say("直接看结果","Skip to result")}</button><button className="pirate-gold-button" onClick={()=>dispatch({type:"next"})}>{frame.round===4?say("查看结果","Final result"):say("下一回合","Next round")} →</button></div>
  </>:<div className="duel-cinema-final">
   <div className="duel-confetti" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{"--i":i} as CSSProperties}/>)}</div>
   <div className="duel-victor"><span className="duel-crown">{c.winner?"👑":"🤝"}</span>{winningPerson?<Avatar person={winningPerson} size={75}/>:<span className="duel-victor-bot">{c.winner?"🤖":"⚓"}</span>}</div>
   <h2>{!c.winner?say("平局！","An honourable draw!"):won?say("你赢了！","Victory, captain!"):`${name(c.winner)} ${say("赢了！","wins!")}`}</h2>
   <div className={`duel-final-gold ${!won&&c.winner?"loss":""}`}>{c.practice?say("练习结束","Practice complete"):!c.winner?say("金币已退回","Stakes returned"):`${won?"+":"−"}${c.stake.toLocaleString()} 🪙`}</div>
   <p className="duel-caption">{c.practice?say("不扣金币","No gold changed"):c.winner?`${say("奖池","Pot")} 🪙 ${(c.stake*2).toLocaleString()}`:say("双方金币全额退回","Both stakes refunded")}</p>
   {c.autoDefended&&<p className="duel-caption">🤖 {say("超时自动防守","Automatic defence after timeout")}</p>}
   <button className="pirate-gold-button" onClick={onDone}>{say("返回海湾","Back to the cove")} →</button>
  </div>}
 </section>;
}
