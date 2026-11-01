"use client";
import {people} from "@/lib/trip";
import {Avatar,useApp} from "./common";
type Props={a:string;b:string;scoreA:number;scoreB:number;round:number;awardA?:number;awardB?:number};
export default function PkScoreboard({a,b,scoreA,scoreB,round,awardA=0,awardB=0}:Props){
 const {lang,p}=useApp(),say=(zh:string,en:string)=>lang==='zh'?zh:en;
 const name=(id:string)=>id==='bot'?say('练习船长','Captain Bot'):p(people.find(x=>x.id===id)??{zh:id,en:id});
 const side=(id:string,score:number,award:number,position:string)=>{
  const who=people.find(x=>x.id===id);
  return <div className={`pk-score-side pk-score-${position}`}>
   {who?<Avatar person={who} size={30}/>:<span className="pk-score-bot" aria-hidden="true">🤖</span>}
   <div className="pk-score-identity"><span className="pk-score-name">{name(id)}</span><div className="pk-score-value"><strong key={score}>{score}</strong><small>{say('分','pts')}</small>{award>0&&<span key={`${round}.${award}`} className="pk-score-award" aria-hidden="true">+{award}</span>}</div></div>
  </div>;
 };
 return <header className="pk-scoreboard" aria-label={say('双方总分','Running score')}>
  <div className="pk-score-pair">{side(a,scoreA,awardA,'a')}<span className="pk-score-vs" aria-hidden="true">⚔️</span>{side(b,scoreB,awardB,'b')}</div>
  <div className="pk-score-progress">{say(`第 ${round} / 5 回合`,`ROUND ${round} / 5`)}</div>
  <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{say(`${name(a)} ${scoreA}分，${name(b)} ${scoreB}分。第${round}回合。`,`${name(a)} ${scoreA} points. ${name(b)} ${scoreB} points. Round ${round}.`)}</span>
 </header>;
}
