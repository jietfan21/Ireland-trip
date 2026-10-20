"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

// Keep screen choices for this app session while unmounting inactive screens, so
// their maps, animation loops and subscriptions do not run behind another tab.
const Memory = createContext<Map<string, unknown> | null>(null);

export function ViewMemory({ children }: { children: ReactNode }) {
  const values = useRef(new Map<string, unknown>());
  return <Memory.Provider value={values.current}>{children}</Memory.Provider>;
}

export function useViewState<T,>(key: string, initial: T | (() => T)) {
  const values = useContext(Memory);
  const state = useState<T>(() => values?.has(key) ? values.get(key) as T : typeof initial === "function" ? (initial as () => T)() : initial);
  useLayoutEffect(() => { values?.set(key, state[0]); }, [values, key, state[0]]);
  return state;
}

export function useViewRef<T,>(key: string, initial: T): RefObject<T> {
  const values = useContext(Memory);
  const local = useRef(initial);
  if (!values) return local;
  if (!values.has(key)) values.set(key, local);
  return values.get(key) as RefObject<T>;
}
