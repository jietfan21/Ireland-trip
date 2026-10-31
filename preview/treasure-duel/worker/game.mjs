export const PEOPLE = [
  { id: 'jiet', name: 'Jiet', emoji: '🧑🏻‍✈️', color: 'green' },
  { id: 'dad', name: 'Dad', emoji: '🧔🏻', color: 'sand' },
  { id: 'mom', name: 'Mum', emoji: '👩🏻', color: 'rose' },
  { id: 'rong', name: 'Rong', emoji: '🧑🏻', color: 'blue' },
  { id: 'yao', name: 'Yao', emoji: '👨🏻', color: 'purple' },
  { id: 'ying', name: 'Ying', emoji: '👩🏻‍🦰', color: 'rose' },
  { id: 'hui', name: 'Hui', emoji: '👩🏻‍✈️', color: 'blue' },
];
export const ISLANDS = [
  { name: 'Shell Shore', points: 1, icon: '🐚' },
  { name: 'Palm Haven', points: 2, icon: '🌴' },
  { name: 'Coral Cove', points: 3, icon: '🪸' },
  { name: 'Skull Rock', points: 4, icon: '💀' },
  { name: 'Crown Island', points: 5, icon: '👑' },
];
const TTL = 24 * 60 * 60 * 1000;
const finished = c => ['complete', 'declined', 'cancelled', 'expired'].includes(c.status);
const check = (condition, message) => { if (!condition) throw new Error(message); };
export function dublinDay(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function initialState(now) {
  return { players: Object.fromEntries(PEOPLE.map(p => [p.id, { gold: 1000 }])), challenges: [], usage: {}, receipts: {}, createdAt: now };
}
export function activeCount(s, id) {
  return s.challenges.filter(c => !c.practice && !finished(c) && (c.from === id || (c.to === id && c.status === 'accepted'))).length;
}
export function sentToday(s, id, now) { return s.usage[dublinDay(now)]?.[id]?.sent ?? 0; }
export function receivedToday(s, id, now) { return s.usage[dublinDay(now)]?.[id]?.received ?? 0; }
export function usedToday(s, id, now) { return sentToday(s, id, now) + receivedToday(s, id, now); }
export function activeOutgoing(s, id) { return s.challenges.filter(c => !c.practice && !finished(c) && c.from === id).length; }
export function activeIncoming(s, id) { return s.challenges.filter(c => !c.practice && c.status === 'accepted' && c.to === id).length; }
export function heldGold(s, id) {
  return s.challenges.reduce((n, c) => n + (!finished(c) && !c.practice && (c.from === id || (c.to === id && c.status === 'accepted')) ? c.stake : 0), 0);
}
export function totalGold(s) {
  return Object.values(s.players).reduce((n, p) => n + p.gold, 0) + PEOPLE.reduce((n, p) => n + heldGold(s, p.id), 0);
}
function refund(s, c) {
  if (c.practice) return;
  s.players[c.from].gold += c.stake;
  if (c.status === 'accepted') s.players[c.to].gold += c.stake;
}
export function expire(s, now) {
  let changed = false;
  for (const c of s.challenges) {
    if (!finished(c) && now >= c.expiresAt) {
      refund(s, c); c.status = 'expired'; c.finishedAt = now; changed = true;
    }
  }
  return changed;
}
export function validatePlan(plan) {
  check(Array.isArray(plan) && plan.length === 5 && plan.every(x => Number.isInteger(x) && x >= 0 && x <= 5), 'Use 0–5 cannonballs on each island.');
  check(plan.reduce((a, b) => a + b, 0) === 12, 'Arrange all 12 cannonballs before locking your plan.');
}
export function scorePlans(a, b) {
  validatePlan(a); validatePlan(b);
  const rounds = ISLANDS.map((island, i) => ({ ...island, a: a[i], b: b[i], winner: a[i] > b[i] ? 'a' : a[i] < b[i] ? 'b' : null }));
  const aScore = rounds.reduce((n, r) => n + (r.winner === 'a' ? r.points : 0), 0);
  const bScore = rounds.reduce((n, r) => n + (r.winner === 'b' ? r.points : 0), 0);
  return { rounds, aScore, bScore, winner: aScore > bScore ? 'a' : aScore < bScore ? 'b' : null };
}
function checkOutgoing(s, id, now) {
  check(activeOutgoing(s, id) < 1, 'You already have an outgoing challenge. Finish it or cancel its unanswered invitation first.');
  check(sentToday(s, id, now) < 1, 'Your daily attack was accepted already. You can still accept up to two invitations.');
}
function settle(s, c, now) {
  const result = scorePlans(c.plans[c.from], c.plans[c.to]);
  c.result = result;
  if (!c.practice) {
    if (result.winner) s.players[result.winner === 'a' ? c.from : c.to].gold += 2 * c.stake;
    else { s.players[c.from].gold += c.stake; s.players[c.to].gold += c.stake; }
  }
  c.status = 'complete'; c.finishedAt = now;
}
export function applyAction(s, actor, body, now, newId, botPlan) {
  check(s.players[actor], 'Choose a captain first.');
  expire(s, now);
  const before = totalGold(s);
  let message = '', challengeId = body.id ?? null;
  if (body.action === 'reset') {
    check(body.confirm === 'RESET DEMO', 'Confirm the demo reset first.');
    const receipts = s.receipts;
    Object.assign(s, initialState(now)); s.receipts = receipts;
    return { message: 'Demo reset. Everyone has 1,000 test gold.', challengeId: null };
  }
  if (body.action === 'invite' || body.action === 'practice') {
    const practice = body.action === 'practice';
    const to = practice ? 'bot' : body.to;
    check(to !== actor && (practice || s.players[to]), 'Choose another captain.');
    const c = { id: newId, from: actor, to, stake: 0, practice, createdAt: now, expiresAt: now + TTL, status: practice ? 'accepted' : 'pending', plans: {} };
    if (practice) {
      check(!s.challenges.some(x => x.practice && !finished(x) && x.from === actor), 'Finish your current practice duel first.');
      validatePlan(botPlan); c.plans.bot = [...botPlan];
    } else {
      checkOutgoing(s, actor, now);
      check(!s.challenges.some(x => !x.practice && !finished(x) && [x.from, x.to].includes(actor) && [x.from, x.to].includes(to)), 'There is already a challenge between you two.');
      const max = Math.floor(Math.min(s.players[actor].gold, s.players[to].gold) * 0.2 / 10) * 10;
      check(Number.isInteger(body.stake) && body.stake >= 10 && body.stake % 10 === 0 && body.stake <= max, 'Choose a stake in tens, up to 20% of the smaller available balance.');
      c.stake = body.stake; s.players[actor].gold -= c.stake;
    }
    s.challenges.unshift(c); challengeId = c.id;
    message = practice ? 'Practice ready. Arrange your cannonballs.' : 'Invitation sent. Your stake is reserved.';
  } else {
    const c = s.challenges.find(x => x.id === body.id);
    check(c && [c.from, c.to].includes(actor), 'Challenge not found for this captain.');
    if (body.action === 'accept') {
      check(c.to === actor && c.status === 'pending', 'This invitation can no longer be accepted.');
      check(sentToday(s, c.from, now) < 1, 'The challenger has already used their daily attack.');
      const smaller = Math.min(s.players[c.from].gold + c.stake, s.players[actor].gold);
      check(c.stake <= Math.floor(smaller * 0.2 / 10) * 10, 'Available gold changed. Decline this invitation and send a smaller challenge.');
      check(s.players[actor].gold >= c.stake, 'Not enough available gold.');
      s.players[actor].gold -= c.stake; c.status = 'accepted'; c.expiresAt = now + TTL; c.acceptedAt = now;
      const day = dublinDay(now); s.usage[day] ??= {};
      for (const id of [c.from, c.to]) s.usage[day][id] ??= { sent: 0, received: 0 };
      s.usage[day][c.from].sent++;
      s.usage[day][c.to].received++;
      message = 'Challenge accepted. Both stakes are reserved.';
    } else if (body.action === 'decline' || body.action === 'cancel') {
      check(c.status === 'pending' && (body.action === 'decline' ? c.to === actor : c.from === actor), 'Only unanswered invitations can be declined or cancelled.');
      refund(s, c); c.status = body.action === 'decline' ? 'declined' : 'cancelled'; c.finishedAt = now;
      message = 'Invitation closed. Reserved gold returned.';
    } else if (body.action === 'lock') {
      check(c.status === 'accepted', 'Accept the challenge before arranging your plan.');
      check(!c.plans[actor], 'Your plan is already locked.');
      validatePlan(body.plan); c.plans[actor] = [...body.plan];
      if (c.plans[c.from] && c.plans[c.to]) { settle(s, c, now); message = 'Both plans are locked. Your battle is ready!'; }
      else message = 'Plan locked. The other captain can submit whenever they are ready.';
    } else if (body.action === 'expire-demo') {
      check(!finished(c), 'This challenge has already ended.');
      c.expiresAt = now; expire(s, now); message = 'Demo expiry applied. Reserved gold returned.';
    } else throw new Error('Unknown action.');
  }
  check(totalGold(s) === before, 'Gold accounting failed.');
  check(Object.values(s.players).every(p => Number.isInteger(p.gold) && p.gold >= 0), 'Invalid gold balance.');
  return { message, challengeId };
}
export function publicState(s, actor, now) {
  check(s.players[actor], 'Unknown captain.');
  return {
    demo: true, day: dublinDay(now), serverTime: now, islands: ISLANDS,
    players: PEOPLE.map(p => ({ ...p, available: s.players[p.id].gold, reserved: heldGold(s, p.id), total: s.players[p.id].gold + heldGold(s, p.id), active: activeCount(s, p.id), usedToday: usedToday(s, p.id, now), sentToday: sentToday(s, p.id, now), receivedToday: receivedToday(s, p.id, now), activeOutgoing: activeOutgoing(s, p.id), activeIncoming: activeIncoming(s, p.id),
      wins: s.challenges.filter(c => !c.practice && c.status === 'complete' && c.result.winner && (c.result.winner === 'a' ? c.from : c.to) === p.id).length })),
    challenges: s.challenges.filter(c => [c.from, c.to].includes(actor)).slice(0, 80).map(c => {
      const visible = { ...c, plans: undefined, ready: { [c.from]: Boolean(c.plans[c.from]), [c.to]: Boolean(c.plans[c.to]) }, myPlan: c.plans[actor] ?? null };
      // Both allocations are present only after server settlement.
      if (c.status === 'complete') visible.plans = c.plans;
      return visible;
    }),
  };
}
