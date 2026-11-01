"use client";
import {useEffect,useState} from "react";
import {ArrowLeft,HelpCircle} from "lucide-react";
import {people} from "@/lib/trip";
import {duelActive,duelStake,DUEL_ICONS,type DuelMatch} from "@/lib/duel";
import {validPkShot} from "@/lib/pk";
import type {useDuel} from "@/lib/duelStore";
import {readLocal,writeLocal} from "@/lib/store";
import {Avatar,useApp} from "./common";
import LegacyPirateDuel from "./LegacyPirateDuel";
import DuelReveal from "./DuelReveal";
import PkRoundReveal from "./PkRoundReveal";
import PkScoreboard from "./PkScoreboard";
import PkRoundHistory from "./PkRoundHistory";
type Props={duel:ReturnType<typeof useDuel>;onGoldChange:()=>void;onTour:()=>void};
export default function PirateDuel({duel,onGoldChange,onTour}:Props){
 const {lang,p,person}=useApp(),say=(zh:string,en:string)=>lang==='zh'?zh:en,me=person?.id??'';
 const [view,setView]=useState<string|null>(null),[target,setTarget]=useState(''),[percent,setPercent]=useState(10),[custom,setCustom]=useState(''),[help,setHelp]=useState(false),[shot,setShot]=useState(0),[seen,setSeen]=useState(0);
 const data=duel.data,m=data?.matches.find(x=>x.id===view),mine=data?.players.find(x=>x.id===me);
 const own=m?.a===me,budget=m?(own?m.remainingA:m.remainingB)??12:12,round=m?.round??1;
 const draftKey=`ie.pk.shot.${me}.${m?.id}.${round}`,seenKey=`ie.pk.seen.${me}.${m?.id}`;
 useEffect(()=>{setView(null);},[me]);
 useEffect(()=>{const saved=readLocal<number>(draftKey,0);setShot(round===5?budget:Number.isInteger(saved)&&saved>=0&&saved<=budget?saved:0);},[draftKey,round,budget]);
 useEffect(()=>{const n=readLocal<number>(seenKey,0);setSeen(Number.isInteger(n)&&n>=0&&n<=5?n:0);},[seenKey]);
 const go=(id:string|null)=>setView(id);
 const name=(id:string)=>id==='bot'?say('练习船长','Captain Bot'):p(people.find(x=>x.id===id)??{zh:id,en:id});
 const captain=(id:string,size=48)=>{const who=people.find(x=>x.id===id);return who?<Avatar person={who} size={size}/>:<span className="duel-bot">🤖</span>;};
 const button=(label:string,fn:()=>void,disabled=false,secondary=false)=><button className={secondary?'pirate-secondary-button':'pirate-gold-button'} onClick={fn} disabled={disabled||duel.busy}>{label}</button>;
 const when=(iso:string)=>new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-IE',{timeZone:'Europe/Dublin',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
 async function act(kind:string,payload:Record<string,unknown>={}){const r=await duel.action(kind,payload);if(r){onGoldChange();if(r.selected)go(r.selected);}}
 const errors:Record<string,string>={offline:say('连接已断开，重连后继续','Reconnect to continue'),outgoing_active:say('你已有一个待加入的邀请','You already have a waiting invitation'),daily_attack_used:say('今日进攻已用，仍可加入别人的PK','Daily attack used · You can still join others'),stake_changed:say('余额已变，请取消邀请并降低金额','Balance changed · Cancel and choose a smaller stake'),invitation_closed:say('邀请已结束，请返回','Invitation ended · Go back'),plan_locked:say('已锁定，等待对方','Locked · Waiting for the other captain'),invalid_shot:say('请选择剩余炮弹以内的数量','Choose within your remaining shots'),invalid_round:say('回合已更新，请刷新','Round changed · Refresh'),game_over:say('新PK已关闭，已有对战可继续','New PKs are closed · Existing battles continue'),battle_started:say('对战已开始，不能取消','Battle started · It cannot be cancelled'),update_required:say('请重新打开页面','Please reload the app')};
 const notice=duel.error?(errors[duel.error]??say('操作未完成，请重试','Could not complete · Retry')):'';
 const legacy=data?.matches.filter(x=>x.mode!=='live')??[];
 const unseen=m?.mode==='live'?(m.rounds??[]).find(x=>x.n>seen):null;
 let content;
 if(!data)content=<div className="duel-empty"><span>⚓</span>{button(say('加载PK','Load PK'),()=>void duel.refresh())}</div>;
 else if(view==='legacy'||(m&&m.mode!=='live')){
  const old={...duel,data:{...data,ended:true,matches:legacy},action:(kind:string,payload:Record<string,unknown>={})=>duel.action('legacy_'+kind,payload)};
  return <><button className="duel-back pk-legacy-back" onClick={()=>go(null)}><ArrowLeft size={16}/>{say('返回PK','Back to PK')}</button><LegacyPirateDuel duel={old} onGoldChange={onGoldChange} onTour={onTour}/></>;
 }else if(view==='new'){
  const other=data.players.find(x=>x.id===target),practice=data.practice,amount=practice?0:custom!==''?Number(custom):duelStake(mine?.gold??0,other?.gold??0,percent),max=duelStake(mine?.gold??0,other?.gold??0,20);
  content=<><h2>{say('邀请谁来PK？','Who will you challenge?')}</h2><div className="duel-crew">{people.filter(x=>x.id!==me).map(x=><button key={x.id} className={target===x.id?'selected':''} aria-pressed={target===x.id} onClick={()=>{setTarget(x.id);setCustom('');}} disabled={duel.busy}><Avatar person={x} size={36}/><strong>{p(x)}</strong></button>)}</div>
   {!practice&&<><div className="duel-stakes">{[5,10,20].map(n=><button key={n} className={percent===n&&custom===''?'selected':''} aria-pressed={percent===n&&custom===''} onClick={()=>{setPercent(n);setCustom('');}}><small>{n}%</small><strong>🪙 {duelStake(mine?.gold??0,other?.gold??0,n).toLocaleString()}</strong></button>)}</div><label className="duel-custom">{say('自定金额','Custom stake')}<input type="number" inputMode="numeric" min={10} max={max} step={10} value={custom} placeholder={`≤ ${max}`} onChange={e=>setCustom(e.target.value)}/></label><div className="duel-pot">{say('每人','Each')} 🪙 {amount.toLocaleString()} <span>→</span> {say('奖池','Pot')} 🪙 {(amount*2).toLocaleString()}</div></>}
   <p className="duel-caption">{practice?say('免费练习','Free practice'):say('双方准备后才暂存金币','Gold held only when both are ready')}</p>
   {button(say('发出邀请','Send challenge'),()=>void act('invite',{target,stake:amount,practice}),!target||(!practice&&(!Number.isInteger(amount)||amount<10||amount%10!==0||amount>max)))}</>;
 }else if(m){
  if(unseen){content=<PkRoundReveal key={`${m.id}.${unseen.n}`} match={m} round={unseen} onNext={()=>{setSeen(unseen.n);writeLocal(seenKey,unseen.n);}}/>;}
  else if(m.status==='complete')content=<DuelReveal key={m.id} match={m} startAtFinal onDone={()=>go(null)}/>;
  else if(m.status==='pending'||m.status==='lobby'){
   const myReady=own?m.readyA:m.readyB;
   content=<div className="pk-room"><h2>{say('PK 房间','PK room')}</h2><div className="pk-room-crew">{[m.a,m.b].map((id,i)=><div key={id}>{captain(id,62)}<strong>{name(id)}</strong><small>{(i===0?m.readyA:m.readyB)?say('✓ 已准备','✓ Ready'):m.status==='pending'&&i===1?say('等待加入','Not joined'):say('等待准备','Not ready')}</small></div>)}</div>
    <div className="duel-pot">{m.practice?say('免费练习','Free practice'):`🪙 ${m.stake.toLocaleString()} ${say('每人','each')}`}</div>
    {m.status==='pending'?own?<p className="pk-waiting">{say(`请${name(m.b)}打开PK并加入。`,`Ask ${name(m.b)} to open PK and join.`)}</p>:button(say('加入PK','Join battle'),()=>void act('join',{id:m.id})):button(myReady?say('已准备 · 等待对方','Ready · Waiting'):say('准备开战','Ready to battle'),()=>void act('ready',{id:m.id}),Boolean(myReady))}
    <p className="duel-caption">⏳ {when(m.expires)} · {say('邀请截止','Join by')}</p>
    {own?button(say('取消邀请','Cancel challenge'),()=>void act('cancel',{id:m.id}),false,true):m.status==='lobby'?button(say('离开房间','Leave room'),()=>void act('leave',{id:m.id}),false,true):null}
   </div>;
  }else if(m.status==='active'){
   const locked=own?m.aReady:m.bReady;
   const change=(n:number)=>{setShot(n);writeLocal(draftKey,n);};
   content=<><PkScoreboard a={m.a} b={m.b} scoreA={m.aScore??0} scoreB={m.bScore??0} round={round}/>
    <div className="duel-round-heading"><h2>{DUEL_ICONS[round-1]} · {round} {say('分','points')}</h2></div>
    <div className="duel-map pk-round-map">{DUEL_ICONS.map((icon,i)=><div key={i} className={i+1===round?'pk-current':i+1<round?'pk-done':''}><span>{icon}</span><small>{i+1} {say('分','pts')}</small></div>)}</div>
    {locked?<div className="pk-locked"><span>🔒</span><h2>{say('已锁定','Locked')}</h2><p>💣 {m.yourShot??0} · {say('等待对方出招','Waiting for the other captain')}</p><small>{say('离开后也能回来继续。','You can leave and return here.')}</small></div>:<div className="pk-shot-editor"><p>💣 <strong>{budget}</strong> {say('剩余炮弹','shots remaining')}</p><div className="pk-shot-stepper"><button aria-label={say('减少炮弹','Fewer shots')} disabled={duel.busy||shot===0||round===5} onClick={()=>change(shot-1)}>−</button><output aria-label={say('本回合炮弹','Shots this round')}>{shot}</output><button aria-label={say('增加炮弹','More shots')} disabled={duel.busy||shot>=budget||round===5} onClick={()=>change(shot+1)}>+</button></div>
     <p className="duel-caption">{round===5?say('最后一回合，用完剩余炮弹','Final round · Use your remaining shots'):say(`出招后剩余 ${budget-shot} 枚`,`After this round: ${budget-shot} left`)}</p>
     {button(duel.busy?say('正在锁定…','Locking…'):say(`锁定 ${shot} 枚炮弹`,`Lock ${shot} shots`),()=>void act('shot',{id:m.id,round,shot}),!validPkShot(shot,budget,round))}</div>}
    <p className="duel-caption pk-round-deadline">⏳ {when(m.expires)} · {say('超时自动出招','Automatic shots after deadline')}</p>
    <PkRoundHistory match={m} onReplay={n=>{setSeen(n-1);writeLocal(seenKey,n-1);}}/>
   </>;
  }else content=<div className="duel-empty"><span>⚓</span><h2>{m.status==='cancelled'?say('邀请已取消','Challenge cancelled'):say('邀请已过期','Challenge expired')}</h2><p>{say('没有扣金币','No gold spent')}</p>{button(say('返回PK','Back to PK'),()=>go(null))}</div>;
 }else{
  const live=data.matches.filter(x=>x.mode==='live'),ongoing=live.filter(duelActive),history=live.filter(x=>x.status==='complete');
  const card=(c:DuelMatch)=>{const id=c.a===me?c.b:c.a,label=c.status==='pending'?c.a===me?say('等待加入','Waiting to join'):say('邀请你PK · 加入','Challenges you · Join'):c.status==='lobby'?say('进入房间','Enter room'):c.status==='active'?say(`第${c.round}回合 · 继续`,`Round ${c.round} · Continue`):say('查看战果','Results');return <button className="duel-match" key={c.id} onClick={()=>go(c.id)}>{captain(id,36)}<span><strong>{name(id)}</strong><small>{c.practice?say('练习','Practice'):`🪙 ${c.stake}`} · {label}</small></span><b>›</b></button>;};
  content=<><div className="duel-home-title"><h2>{say('实时PK','Live PK')}</h2><button className="pirate-icon-button" aria-label={say('玩法','Rules')} aria-expanded={help} onClick={()=>setHelp(v=>!v)}><HelpCircle size={19}/></button></div>
   {help&&<div className="duel-help"><button className="duel-tour-replay" onClick={onTour}>{say('简明教程 ↗','Quick tour ↗')}</button>{say('邀请、加入、双方准备后开战。5回合共12枚炮弹，无单岛上限。每回合双方秘密出招，一起揭晓，再决定下一回合。每回合等24小时，超时自动出招；断线可回来继续。每天进攻1次，加入别人的PK不限。邀请过期不扣金币。','Challenge, join, then both ready up. Five rounds, 12 shots total, no island cap. Both choose secretly; reveal together, then react next round. Each round waits 24h before automatic shots. Reconnect to continue. One daily attack; unlimited incoming PKs. Expired invitations cost no gold.')}</div>}
   {ongoing.map(card)}
   {!data.ended&&button(data.used?say('今日进攻已用','Daily attack used'):say('邀请家人PK','Challenge a captain'),()=>{setTarget(people.find(x=>x.id!==me)?.id??'');setCustom('');go('new');},Boolean(data.used||ongoing.some(x=>x.a===me&&x.b!=='bot'&&(x.status==='pending'||x.status==='lobby'))))}
   <p className="duel-caption">{say('5回合 · 共12枚 · 每回合24小时','5 rounds · 12 shots total · 24h per round')}</p>
   {!data.ended&&button(say('免费练习 🤖','Free practice 🤖'),()=>void act('invite',{target:'bot',stake:0,practice:true}),ongoing.some(x=>x.a===me&&x.b==='bot'&&(x.status==='pending'||x.status==='lobby')),true)}
   {history.length>0&&<><h3 className="duel-history-title">{say('战果','Results')}</h3>{history.slice(0,5).map(card)}</>}
   {legacy.length>0&&button(say('之前的对决','Previous duels'),()=>go('legacy'),false,true)}
  </>;
 }
 return <main className="pirate-duel">{view&&view!=='legacy'&&<button className="duel-back" onClick={()=>go(null)} disabled={duel.busy}><ArrowLeft size={16}/>{say('返回','Back')}</button>}{notice&&<div className="pirate-notice" role="alert">{notice}<button onClick={()=>void duel.refresh()}>{say('刷新','Refresh')}</button></div>}{content}</main>;
}
