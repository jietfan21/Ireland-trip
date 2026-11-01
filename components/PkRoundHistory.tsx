"use client";
import {DUEL_ICONS,type DuelMatch} from "@/lib/duel";
import {pkRoundPoints} from "@/lib/pk";
import {people} from "@/lib/trip";
import {useApp} from "./common";
export default function PkRoundHistory({match:m,onReplay}:{match:DuelMatch;onReplay?:(n:number)=>void}){
 const {lang,p}=useApp(),say=(zh:string,en:string)=>lang==='zh'?zh:en;
 const name=(id:string)=>id==='bot'?say('练习船长','Captain Bot'):p(people.find(x=>x.id===id)??{zh:id,en:id});
 if(!m.rounds?.length)return null;
 return <div className="pk-points-history"><table><caption>{say('回合战果','Round results')}</caption>
  <thead><tr><th scope="col">{say('回合','Round')}</th><th scope="col"><span>{name(m.a)}</span><small>{say('得分','Points')}</small></th><th scope="col"><span>{name(m.b)}</span><small>{say('得分','Points')}</small></th><th scope="col">💣 <span>{say('炮弹','Shots')}</span></th></tr></thead>
  <tbody>{m.rounds.map(r=>{const [a,b]=pkRoundPoints(r,m.scoring??'weighted');return <tr key={r.n}><th scope="row">{onReplay?<button onClick={()=>onReplay(r.n)} aria-label={say(`重看第${r.n}回合`,`Replay round ${r.n}`)}>{DUEL_ICONS[r.n-1]} {r.n}<span aria-hidden="true"> ↗</span></button>:<span>{DUEL_ICONS[r.n-1]} {r.n}</span>}{(r.autoA||r.autoB)&&<span className="pk-history-auto" aria-label={say('超时自动出招','Automatic shots')}>🤖</span>}</th><td className={a?'pk-earned':''}>{a?`+${a}`:'0'}</td><td className={b?'pk-earned':''}>{b?`+${b}`:'0'}</td><td className="pk-history-shots">{r.a} : {r.b}</td></tr>;})}</tbody>
 </table></div>;
}
