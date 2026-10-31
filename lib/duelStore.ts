"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./store";
import type { DuelState } from "./duel";
function requestKey(){ if(typeof crypto!=="undefined"&&"randomUUID" in crypto)return crypto.randomUUID();return "10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(+c^Math.random()*16>>+c/4).toString(16)); }
function timed<T>(promise:PromiseLike<T>):Promise<T>{return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("offline")),8000);Promise.resolve(promise).then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});});}
export function useDuel(me:string|null){
 const [data,setData]=useState<DuelState|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const current=useRef(me); current.current=me;
 const mounted=useRef(true),lock=useRef(false),pending=useRef<{signature:string;key:string}|null>(null);
 const refresh=useCallback(async()=>{
  const db=supabase();if(!me||!db){setError("offline");return;}
  try{const r=await timed(db.rpc("pirate_duel",{p_player:me}));if(r.error)throw r.error;if(mounted.current&&current.current===me){setData(prev=>JSON.stringify(prev)===JSON.stringify(r.data)?prev:r.data as DuelState);setError("");}}
  catch{if(mounted.current&&current.current===me)setError("offline");}
 },[me]);
 useEffect(()=>{mounted.current=true;setData(null);void refresh();const focus=()=>void refresh();window.addEventListener("focus",focus);const timer=setInterval(()=>{if(!document.hidden&&!lock.current)void refresh();},8000);return()=>{mounted.current=false;clearInterval(timer);window.removeEventListener("focus",focus);};},[refresh]);
 const action=useCallback(async(kind:string,payload:Record<string,unknown>={})=>{
  if(lock.current||!me)return null;const db=supabase();if(!db){setError("offline");return null;}lock.current=true;setBusy(true);setError("");
  const signature=JSON.stringify([me,kind,payload]);const key=pending.current?.signature===signature?pending.current.key:requestKey();pending.current={signature,key};
  try{const call=()=>timed(db.rpc("pirate_duel",{p_player:me,p_action:kind,p_payload:payload,p_key:key}));let r;try{r=await call();}catch{r=await call();}if(r.error){pending.current=null;throw r.error;}pending.current=null;if(mounted.current&&current.current===me)setData(r.data as DuelState);return r.data as DuelState;}
  catch(e){if(mounted.current&&current.current===me)setError((e as {message?:string}).message??"offline");void refresh();return null;}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 },[me,refresh]);
 return {data,error,busy,refresh,action};
}
