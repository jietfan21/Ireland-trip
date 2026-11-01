export function validPkShot(shot:number,remaining:number,round:number){
 return Number.isInteger(shot)&&Number.isInteger(remaining)&&remaining>=0&&remaining<=12&&round>=1&&round<=5&&Number.isInteger(round)&&shot>=0&&shot<=remaining&&(round!==5||shot===remaining);
}

import type {PkRound,PkScoring} from './duel';
export function pkRoundPoints(round:Pick<PkRound,'n'|'a'|'b'>,scoring:PkScoring='equal'):[number,number]{
 const point=scoring==='equal'?1:round.n;
 return [round.a>round.b?point:0,round.b>round.a?point:0];
}
export function pkScoreAt(rounds:PkRound[],through:number,scoring:PkScoring='equal'):[number,number]{
 return rounds.filter(r=>r.n<=through).reduce<[number,number]>((score,r)=>{const [a,b]=pkRoundPoints(r,scoring);return [score[0]+a,score[1]+b];},[0,0]);
}
