import { create } from "zustand";

type TransitionPhase = "idle" | "entering" | "navigating" | "leaving";

type TransitionState = {
  isTransitioning: boolean;
  phase: TransitionPhase;
  targetHref: string | null;
  beginTransition: (href: string) => void;
  markNavigating: () => void;
  markLeaving: () => void;
  completeTransition: () => void;
};

export const useTransitionStore = create<TransitionState>((set) => ({
  isTransitioning: false,
  phase: "idle",
  targetHref: null,
  beginTransition: (href) =>
    set({ isTransitioning: true, phase: "entering", targetHref: href }),
  markNavigating: () => set({ phase: "navigating" }),
  markLeaving: () => set({ phase: "leaving" }),
  completeTransition: () =>
    set({ isTransitioning: false, phase: "idle", targetHref: null }),
}));
