"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, HelpCircle, Shuffle } from "lucide-react";
import { people } from "@/lib/trip";
import { duelActive, duelStake, validDuelPlan, DUEL_ICONS, type DuelMatch } from "@/lib/duel";
import type { useDuel } from "@/lib/duelStore";
import { readLocal, writeLocal } from "@/lib/store";
import { Avatar, useApp } from "./common";
import DuelReveal from "./DuelReveal";

type Props={duel:ReturnType<typeof useDuel>;onGoldChange:()=>void;onTour:()=>void};
export default function PirateDuel({duel,onGoldChange,onTour}:Props){
 const {lang,p,person}=useApp(),say=(zh:string,en:string)=>lang==="zh"?zh:en,me=person?.id??"";
 const [view,setView]=useState<string|null>(null),[target,setTarget]=useState(""),[percent,setPercent]=useState(10),[custom,setCustom]=useState(""),[plan,setPlan]=useState<number[]>([0,0,0,0,0]),[help,setHelp]=useState(false);
 const [prepared,setPrepared]=useState<{target:string;stake:number;practice:boolean}|null>(null);
 const data=duel.data,c=data?.matches.find(x=>x.id===view),mine=data?.players.find(x=>x.id===me);
 const name=(id:string)=>id==="bot"?say("练习船长","Captain Bot"):p(people.find(x=>x.id===id)??{zh:id,en:id});
 const opponent=(m:DuelMatch)=>m.a===me?m.b:m.a;
 function loadPlan(key:string){const saved=readLocal<unknown>(key,null);setPlan(Array.isArray(saved)&&saved.length===5&&saved.every(n=>Number.isInteger(n)&&n>=0)&&saved.reduce((a,b)=>a+b,0)<=12?saved:[0,0,0,0,0]);}
 const go=(id:string|null)=>{setView(id);if(id)loadPlan(`ie.duel.${me}.${id}`);};
 function prepare(to:string,stake:number,practice:boolean){setPrepared({target:to,stake,practice});setView("prepare");loadPlan(`ie.duel.launch.${me}.${to}`);}
 useEffect(()=>{setView(null);setPlan([0,0,0,0,0]);setPrepared(null);},[me]);
 async function act(kind:string,payload:Record<string,unknown>={}){const r=await duel.action(kind,payload);if(r){onGoldChange();if(r.selected)go(r.selected);return true;}return false;}
 const errors:Record<string,string>={offline:say("需要网络，请重试","Reconnect and try again"),outgoing_active:say("先完成当前进攻","Finish your outgoing attack first"),already_invited:say("你们已有一个挑战","You already have a challenge"),daily_attack_used:say("今日进攻已用，仍可防守","Daily attack used · Defence stays open"),stake_changed:say("余额已变，请改用较小金额","Balance changed · Choose a smaller stake"),invitation_closed:say("对决已结束，请返回","Duel ended · Go back"),plan_locked:say("阵型已锁定","Your plan is already locked"),invalid_plan:say("请分配全部12枚炮弹","Arrange all 12 cannonballs"),game_over:say("本次比赛已结束","The season has ended"),attack_started:say("进攻已发出，不能取消","Attack launched · It cannot be cancelled"),update_required:say("请重新打开页面","Please reload the app")};
 const notice=duel.error?(errors[duel.error]??say("操作未完成，请刷新重试","Could not complete · Refresh and retry")):"";
 const button=(label:string,fn:()=>void,disabled=false,secondary=false)=><button className={secondary?"pirate-secondary-button":"pirate-gold-button"} onClick={fn} disabled={disabled||duel.busy}>{label}</button>;
 const deadline=(m:DuelMatch)=>new Intl.DateTimeFormat(lang==="zh"?"zh-CN":"en-IE",{timeZone:"Europe/Dublin",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(m.expires));
 function editor(launch:boolean,m?:DuelMatch){
  const left=12-plan.reduce((a,b)=>a+b,0),to=launch?prepared!.target:opponent(m!),practice=launch?prepared!.practice:m!.practice,stake=launch?prepared!.stake:m!.stake;
  const key=launch?`ie.duel.launch.${me}.${to}`:`ie.duel.${me}.${m!.id}`;
  const update=(next:number[])=>{setPlan(next);writeLocal(key,next);};
  return <><div className="duel-plan-head"><h2>{launch?say("布置进攻","Plan your attack"):say("布置防守","Plan your defence")}</h2><button className="pirate-icon-button" aria-label={say("随机分配","Mix a plan")} onClick={()=>{const next=[0,0,0,0,0];for(let n=0;n<12;n++){next[Math.floor(Math.random()*5)]++;}update(next);}} disabled={duel.busy}><Shuffle size={18}/></button></div>
   <div className="duel-ammo"><strong>💣 {left}</strong><span>{say("剩余","left")}</span><small>{name(me)} ⚔ {name(to)}</small></div>
   {!launch&&m?.forced&&<p className="duel-deadline">⏳ {say("防守截止","Defend by")} {deadline(m)}</p>}
   <div className="duel-allocation">{DUEL_ICONS.map((icon,i)=><div key={i} className="duel-island"><span className="duel-island-icon">{icon}</span><strong>{i+1} {say("分","pts")}</strong><div className="duel-stepper"><button aria-label={say(`第${i+1}岛减少`,`Fewer on island ${i+1}`)} disabled={duel.busy||plan[i]===0} onClick={()=>{const a=[...plan];a[i]--;update(a);}}>−</button><output>{plan[i]}</output><button aria-label={say(`第${i+1}岛增加`,`More on island ${i+1}`)} disabled={duel.busy||left===0} onClick={()=>{const a=[...plan];a[i]++;update(a);}}>+</button></div></div>)}</div>
   <div className="duel-plan-footer">{button(duel.busy?say("正在锁定…","Locking…"):launch?say("发起进攻","Launch attack"):say("锁定防守","Lock defence"),()=>void(launch?act("launch",{target:prepared!.target,stake:prepared!.stake,practice:prepared!.practice,plan}):act("lock",{id:m!.id,plan})),!validDuelPlan(plan))}
   <p className="duel-caption">{practice?say("练习 · 不扣金币","Practice · No gold spent"):launch?`${say("双方各","Each stakes")} 🪙 ${stake.toLocaleString()}`:`🔒 ${say("已暂存","Held")} 🪙 ${stake.toLocaleString()}`}{launch?(to==="bot"?"":` · ${say("24小时后自动防守","Auto-defence after 24h")}`):` · ${say("锁定后不可更改","Final once locked")}`}</p></div></>;
 }
 let content;
 if(!data)content=<div className="duel-empty"><span>⚓</span>{duel.error?button(say("重试","Retry"),()=>void duel.refresh()):say("正在加载…","Loading…")}</div>;
 else if(view==="new"){
  const other=data.players.find(x=>x.id===target),practice=data.practice,amount=practice?0:custom!==""?Number(custom):duelStake(mine?.gold??0,other?.gold??0,percent),max=duelStake(mine?.gold??0,other?.gold??0,20);
  content=<><h2>{say("选择对手","Choose a captain")}</h2><div className="duel-crew">{people.filter(x=>x.id!==me).map(x=><button key={x.id} className={target===x.id?"selected":""} aria-pressed={target===x.id} disabled={duel.busy} onClick={()=>{setTarget(x.id);setCustom("");}}><Avatar person={x} size={36}/><strong>{p(x)}</strong></button>)}</div>
  {!practice&&<><div className="duel-stakes">{[5,10,20].map(n=><button key={n} className={percent===n&&custom===""?"selected":""} aria-pressed={percent===n&&custom===""} onClick={()=>{setPercent(n);setCustom("");}}><small>{n}%</small><strong>🪙 {duelStake(mine?.gold??0,other?.gold??0,n).toLocaleString()}</strong></button>)}</div><label className="duel-custom">{say("自定金额","Custom stake")}<input type="number" inputMode="numeric" min={10} max={max} step={10} value={custom} placeholder={`≤ ${max.toLocaleString()}`} onChange={e=>setCustom(e.target.value)}/></label><div className="duel-pot">{say("每人","Each")} 🪙 {amount.toLocaleString()} <span>→</span> {say("奖池","Pot")} 🪙 {(amount*2).toLocaleString()}</div></>}
  {practice&&<p className="duel-caption">{say("练习 · 不扣金币","Practice · No gold spent")}</p>}{button(say("布置进攻","Arrange attack"),()=>prepare(target,amount,practice),!target||(!practice&&(!Number.isInteger(amount)||amount<10||amount%10!==0||amount>max)))}</>;
 }else if(view==="prepare"&&prepared)content=editor(true);
 else if(c){
  const other=opponent(c),ready=c.a===me?c.aReady:c.bReady;
  if(c.status==="pending")content=<div className="duel-empty"><span>⚔️</span><h2>{name(other)}</h2><p>{c.practice?say("练习","Practice"):`🪙 ${c.stake.toLocaleString()} ${say("每人","each")}`}</p>{c.a===me?button(say("取消旧邀请","Cancel old invite"),()=>void act("cancel",{id:c.id}),false,true):<>{button(say("接受旧邀请","Accept old invite"),()=>void act("accept",{id:c.id}))}{button(say("拒绝旧邀请","Decline old invite"),()=>void act("decline",{id:c.id}),false,true)}</>}</div>;
  else if(c.status==="accepted"&&ready)content=<div className="duel-empty"><span>🔒</span><h2>{say("进攻已锁定","Attack locked")}</h2><p>{name(other)} · {say("等待防守","Awaiting defence")}</p><p className="duel-deadline">⏳ {deadline(c)}</p>{c.forced&&<small>{say("24小时未回应 → 随机防守","No response in 24h → random defence")}</small>}</div>;
  else if(c.status==="accepted")content=editor(false,c);
  else if(c.status==="complete")content=<DuelReveal key={c.id} match={c} onDone={()=>go(null)}/>;
  else content=<div className="duel-empty"><span>⚓</span><h2>{say("对决已结束","Duel ended")}</h2>{!c.practice&&<p>{say("金币已退回","Reserved gold returned")}</p>}</div>;
 }else{
  const ongoing=data.matches.filter(duelActive),history=data.matches.filter(x=>x.status==="complete"),outgoing=data.practice&&ongoing.some(x=>x.a===me&&x.practice);
  const card=(x:DuelMatch)=>{const other=opponent(x),who=people.find(p=>p.id===other),ready=x.a===me?x.aReady:x.bReady;const label=x.status==="complete"?x.autoDefended?say("自动防守 · 查看战果","Auto defence · Reveal"):say("查看战果","Reveal"):x.status==="pending"?say("旧邀请","Old invitation"):ready?say("等待对方防守","Awaiting defence"):say("轮到你防守","Your defence");return <button className="duel-match" key={x.id} onClick={()=>go(x.id)}>{who?<Avatar person={who} size={36}/>:<span className="duel-bot">🤖</span>}<span><strong>{name(other)}</strong><small>{x.practice?say("练习","Practice"):`🪙 ${x.stake.toLocaleString()}`} · {label}</small></span><b>›</b></button>;};
  content=<><div className="duel-home-title"><h2>{say("宝藏对决","Treasure Duel")}</h2><button className="pirate-icon-button" aria-label={say("玩法","Rules")} aria-expanded={help} onClick={()=>setHelp(v=>!v)}><HelpCircle size={19}/></button></div><div className="duel-map">{DUEL_ICONS.map((icon,i)=><div key={i}><span>{icon}</span><small>{i+1} {say("分","pts")}</small></div>)}</div>
   {help&&<div className="duel-help"><button className="duel-tour-replay" onClick={onTour} disabled={duel.busy}>{say("简明教程 ↗","Quick tour ↗")}</button>{say("12枚炮弹分到5座岛，自由分配，无单岛上限。炮弹多的一方拿下该岛分数。先锁定阵型再进攻，双方金币立即暂存。每天可进攻1次，被进攻不限；不能拒绝或取消。24小时未回应，服务器随机分配防守阵型，仍有机会赢。平局退回金币，无额外盾牌惩罚。赛季截止时，未满24小时的对决退回金币。","Arrange 12 shots over 5 islands, with no per-island cap. More shots wins island points. Lock your plan to attack; both stakes are held immediately. One daily attack, unlimited incoming attacks, no declining or cancelling. After 24h, a saved random defence plays for an absent defender and can still win. Draws refund both stakes; no shield penalty. Shortened season-end windows refund unfinished duels.")}</div>}
   {!data.ended&&button(!data.practice&&data.used?say("今日进攻已用","Daily attack used"):say("进攻家人","Attack a captain"),()=>{setTarget(people.find(x=>x.id!==me)?.id??"");setCustom("");go("new");},outgoing||(!data.practice&&data.used))}
   <p className="duel-caption">{data.practice?say("练习日 · 11月1日正式开赛","Practice day · Official play 1 Nov"):say("每日1次进攻 · 24小时后自动防守","One daily attack · Auto-defence after 24h")}</p>
   {ongoing.map(card)}{history.length>0&&<><h3 className="duel-history-title">{say("战果","Results")}</h3>{history.slice(0,5).map(card)}</>}{!data.ended&&button(say("免费练习 🤖","Free practice 🤖"),()=>prepare("bot",0,true),false,true)}</>;
 }
 return <main className="pirate-duel">{view&&<button className="duel-back" onClick={()=>go(null)} disabled={duel.busy}><ArrowLeft size={16}/>{say("返回","Back")}</button>}{notice&&<div className="pirate-notice" role="alert">{notice}<button onClick={()=>duel.error==="update_required"?window.location.reload():void duel.refresh()}>{say("刷新","Refresh")}</button></div>}{content}</main>;
}
