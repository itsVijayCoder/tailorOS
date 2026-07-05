"use client";

import { useEffect, type ReactNode } from "react";

type SmoothScrollProviderProps = {
  children: ReactNode;
};

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frameId = 0;
    let disposed = false;
    let cleanup = () => {};

    async function initializeSmoothScroll() {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

      if (disposed) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.12,
        easing: (time) => Math.min(1, 1.001 - 2 ** (-10 * time)),
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.12,
        wheelMultiplier: 0.86,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const raf = (time: number) => {
        lenis.raf(time);
        frameId = window.requestAnimationFrame(raf);
      };

      frameId = window.requestAnimationFrame(raf);

      cleanup = () => {
        window.cancelAnimationFrame(frameId);
        lenis.off("scroll", ScrollTrigger.update);
        lenis.destroy();
      };
    }

    void initializeSmoothScroll();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return children;
}
