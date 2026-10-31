export type RevealPhase = "intro" | "fire" | "result" | "final";
export type RevealFrame = { round: number; phase: RevealPhase };
export type RevealEvent = { type: "next" | "skip" | "reduce" } | { type: "tick"; round: number; phase: RevealPhase };
export const initialReveal: RevealFrame = { round: 0, phase: "intro" };
export function revealReducer(state: RevealFrame, event: RevealEvent): RevealFrame {
 if (state.phase === "final") return state;
 if (event.type === "skip") return { round: 4, phase: "final" };
 if (event.type === "reduce") return { ...state, phase: "result" };
 if (event.type === "tick") {
  if (event.round !== state.round || event.phase !== state.phase) return state;
  if (state.phase === "intro") return { ...state, phase: "fire" };
  if (state.phase === "fire") return { ...state, phase: "result" };
 }
 return state.round < 4 ? { round: state.round + 1, phase: "intro" } : { round: 4, phase: "final" };
}
