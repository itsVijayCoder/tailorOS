"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useTransitionStore } from "@/store/transition-store";

export function PageTransitionOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const { completeTransition, isTransitioning, markLeaving, phase } =
    useTransitionStore();

  useEffect(() => {
    if (!isTransitioning || phase !== "entering") {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    async function animateIn() {
      const { default: gsap } = await import("gsap");

      if (disposed || !overlayRef.current || !lineRef.current) {
        return;
      }

      const timeline = gsap.timeline();

      timeline
        .set(overlayRef.current, {
          display: "grid",
          transformOrigin: "bottom center",
        })
        .fromTo(
          overlayRef.current,
          { scaleY: 0 },
          { duration: 0.55, ease: "power4.inOut", scaleY: 1 },
        )
        .fromTo(
          lineRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          { duration: 0.65, ease: "power4.inOut", scaleX: 1 },
          "-=0.34",
        )
        .fromTo(
          markRef.current,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, duration: 0.35, ease: "power3.out", y: 0 },
          "-=0.42",
        );

      cleanup = () => timeline.kill();
    }

    void animateIn();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [isTransitioning, phase]);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    if (!isTransitioning) {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    async function animateOut() {
      const { default: gsap } = await import("gsap");

      if (disposed || !overlayRef.current || !lineRef.current) {
        return;
      }

      window.scrollTo({ top: 0, behavior: "instant" });
      markLeaving();

      const timeline = gsap.timeline({
        onComplete: completeTransition,
      });

      timeline
        .to(lineRef.current, {
          duration: 0.36,
          ease: "power3.in",
          scaleX: 0,
          transformOrigin: "right center",
        })
        .to(
          markRef.current,
          { autoAlpha: 0, duration: 0.25, ease: "power2.out", y: -8 },
          "<",
        )
        .to(overlayRef.current, {
          duration: 0.55,
          ease: "power4.inOut",
          scaleY: 0,
          transformOrigin: "top center",
        })
        .set(overlayRef.current, { display: "none" });

      cleanup = () => timeline.kill();
    }

    void animateOut();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [completeTransition, isTransitioning, markLeaving, pathname]);

  return (
    <div
      aria-hidden="true"
      className="page-transition-overlay fixed inset-0 hidden place-items-center overflow-hidden"
      ref={overlayRef}
    >
      <div className="relative flex flex-col items-center gap-5">
        <div
          className="font-display text-2xl font-light italic tracking-wide text-primary"
          ref={markRef}
        >
          TailorOS
        </div>
        <div className="h-px w-64 overflow-hidden bg-border">
          <div className="h-full w-full bg-primary" ref={lineRef} />
        </div>
      </div>
    </div>
  );
}
