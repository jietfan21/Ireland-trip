export function validPkShot(shot:number,remaining:number,round:number){
 return Number.isInteger(shot)&&Number.isInteger(remaining)&&remaining>=0&&remaining<=12&&round>=1&&round<=5&&Number.isInteger(round)&&shot>=0&&shot<=remaining&&(round!==5||shot===remaining);
}
