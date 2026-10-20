import type { PlayerRow } from "./pirate";

// Reserve breathing room for the rim, pointer and shadow inside the stage.
export function fittedWheelSize(width: number, height: number): number {
  return Math.max(0, Math.floor(Math.min(380, width - 24, height - 28)));
}

export function animatedGoldValue(from: number, to: number, progress: number): number {
  const t = Math.max(0, Math.min(1, progress));
  return Math.round(from + (to - from) * (1 - (1 - t) ** 3));
}

// Keep turning forwards from the previous landing, including consecutive identical results.
export function nextWheelRotation(previous: number, target: number, count: number, turns = 5): number {
  const landing = (360 - (target + 0.5) * (360 / count)) % 360;
  const current = ((previous % 360) + 360) % 360;
  return previous + turns * 360 + ((landing - current + 360) % 360);
}

// Mirror the existing steal eligibility rule for presentation only. The server picks the victim.
// Include the returned victim even if another player's balance changed during the animation.
export function stealCandidates(
  board: { id: string; gold: number }[], me: string, victim: string,
): string[] {
  const poorest = Math.min(...board.map((x) => x.gold));
  const others = board.filter((x) => x.id !== me && x.gold > 0);
  const eligible = others.filter((x) => x.gold > poorest);
  const ids = (eligible.length ? eligible : others).map((x) => x.id);
  if (victim !== me && !ids.includes(victim)) ids.push(victim);
  return ids;
}

export type MirrorOrder = { kind: "trade" | "buy"; gold: number; shields: number; price: number };
export function mirrorOrderChanged(order: MirrorOrder, mine: Pick<PlayerRow, "gold" | "shields">, price: number): boolean {
  return order.kind === "buy" ? order.gold !== mine.gold || order.price !== price : order.shields !== mine.shields;
}
