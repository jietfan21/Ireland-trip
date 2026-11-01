export function validPkShot(shot:number,remaining:number,round:number){
 return Number.isInteger(shot)&&Number.isInteger(remaining)&&remaining>=0&&remaining<=12&&round>=1&&round<=5&&Number.isInteger(round)&&shot>=0&&shot<=remaining&&(round!==5||shot===remaining);
}

import type {PkRound} from './duel';
export function pkRoundPoints(round:Pick<PkRound,'n'|'a'|'b'>):[number,number]{
 return [round.a>round.b?round.n:0,round.b>round.a?round.n:0];
}
export function pkScoreAt(rounds:PkRound[],through:number):[number,number]{
 return rounds.filter(r=>r.n<=through).reduce<[number,number]>((score,r)=>{const [a,b]=pkRoundPoints(r);return [score[0]+a,score[1]+b];},[0,0]);
}
