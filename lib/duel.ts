export const DUEL_START = "2026-11-01";
export const DUEL_END = "2026-11-07";
export const DUEL_POINTS = [1, 2, 3, 4, 5];
export const DUEL_ICONS = ["🐚", "🌴", "🪸", "💀", "👑"];
export function duelSeason(day: string) { return day < DUEL_START ? "practice" : day > DUEL_END ? "over" : "official"; }
export function validDuelPlan(plan: number[]) { return plan.length === 5 && plan.every(n => Number.isInteger(n) && n >= 0 && n <= 5) && plan.reduce((a,b)=>a+b,0) === 12; }
export function duelStake(a: number, b: number, percent: number) { return Math.floor(Math.min(a,b)*percent/100/10)*10; }
export function duelScores(a: number[],b: number[]) {
 if (!validDuelPlan(a)||!validDuelPlan(b)) throw new Error("invalid_plan");
 return DUEL_POINTS.reduce((s,n,i)=>[s[0]+(a[i]>b[i]?n:0),s[1]+(b[i]>a[i]?n:0)],[0,0]);
}
export type DuelMatch = { id: string; a: string; b: string; stake: number; practice: boolean; status: "pending"|"accepted"|"complete"|"cancelled"|"declined"|"expired"; expires: string; aReady: boolean; bReady: boolean; aPlan: number[]|null; bPlan: number[]|null; aScore: number|null; bScore: number|null; winner: string|null };
export type DuelState = { day: string; practice: boolean; ended: boolean; used: boolean; selected?: string; players: {id:string;gold:number;reserved:number}[]; matches: DuelMatch[] };
export const duelActive = (c:DuelMatch) => c.status === "pending" || c.status === "accepted";
