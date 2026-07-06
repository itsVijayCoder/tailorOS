"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type AnimationProviderProps = {
  children: ReactNode;
};

export function AnimationProvider({ children }: AnimationProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    async function initializeAnimations() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (disposed) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      const manualCleanups: Array<() => void> = [];
      const media = gsap.matchMedia();

      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, filter: "blur(10px)", y: 32 },
            {
              autoAlpha: 1,
              duration: 0.95,
              ease: "power3.out",
              filter: "blur(0px)",
              scrollTrigger: {
                once: true,
                start: "top 84%",
                trigger: element,
              },
              y: 0,
            },
          );
        });

        gsap.utils
          .toArray<HTMLElement>("[data-stagger]")
          .forEach((container) => {
            const childrenToAnimate = Array.from(container.children);

            gsap.fromTo(
              childrenToAnimate,
              { autoAlpha: 0, y: 24 },
              {
                autoAlpha: 1,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: {
                  once: true,
                  start: "top 84%",
                  trigger: container,
                },
                stagger: 0.08,
                y: 0,
              },
            );
          });

        gsap.utils.toArray<HTMLElement>(".image-reveal").forEach((element) => {
          const image = element.querySelector("img");

          gsap.fromTo(
            element,
            { clipPath: "inset(0 0 100% 0 round 24px)" },
            {
              clipPath: "inset(0 0 0% 0 round 24px)",
              duration: 1.2,
              ease: "power4.out",
              scrollTrigger: {
                once: true,
                start: "top 82%",
                trigger: element,
              },
            },
          );

          if (image) {
            gsap.fromTo(
              image,
              { scale: 1.08 },
              {
                duration: 1.2,
                ease: "power4.out",
                scale: 1,
                scrollTrigger: {
                  once: true,
                  start: "top 82%",
                  trigger: element,
                },
              },
            );
          }
        });

        gsap.utils
          .toArray<HTMLElement>("[data-parallax]")
          .forEach((element, index) => {
            const parsed = Number(element.dataset.parallax);
            const yPercent = Number.isFinite(parsed)
              ? Math.max(-8, Math.min(8, parsed))
              : index % 2 === 0
                ? -8
                : 8;

            gsap.to(element, {
              ease: "none",
              scrollTrigger: {
                end: "bottom top",
                scrub: true,
                start: "top bottom",
                trigger: element,
              },
              yPercent,
            });
          });

        media.add("(min-width: 1024px)", () => {
          gsap.utils
            .toArray<HTMLElement>("[data-horizontal]")
            .forEach((section) => {
              const track = section.querySelector<HTMLElement>(
                "[data-horizontal-track]",
              );

              if (!track) {
                return;
              }

              const getDistance = () =>
                Math.max(0, track.scrollWidth - window.innerWidth + 96);

              gsap.to(track, {
                ease: "none",
                scrollTrigger: {
                  end: () => `+=${getDistance()}`,
                  invalidateOnRefresh: true,
                  pin: true,
                  scrub: 1,
                  start: "top top",
                  trigger: section,
                },
                x: () => -getDistance(),
              });
            });
        });

        const canMagnetize =
          window.matchMedia("(pointer: fine)").matches &&
          !window.matchMedia("(hover: none)").matches;

        if (canMagnetize) {
          gsap.utils
            .toArray<HTMLElement>("[data-magnetic]")
            .forEach((element) => {
              const content =
                element.querySelector<HTMLElement>("[data-magnetic-content]") ??
                element;
              const strength = Number(element.dataset.magnetic) || 12;
              const xTo = gsap.quickTo(content, "x", {
                duration: 0.45,
                ease: "power3.out",
              });
              const yTo = gsap.quickTo(content, "y", {
                duration: 0.45,
                ease: "power3.out",
              });

              const handlePointerMove = (event: PointerEvent) => {
                const rect = element.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;

                xTo(x * strength);
                yTo(y * strength);
              };
              const handlePointerLeave = () => {
                xTo(0);
                yTo(0);
              };

              element.addEventListener("pointermove", handlePointerMove);
              element.addEventListener("pointerleave", handlePointerLeave);

              manualCleanups.push(() => {
                element.removeEventListener("pointermove", handlePointerMove);
                element.removeEventListener("pointerleave", handlePointerLeave);
              });
            });
        }

        gsap.utils.toArray<HTMLElement>(".premium-card").forEach((card) => {
          let frame = 0;

          const handlePointerMove = (event: PointerEvent) => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
              const rect = card.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;

              card.style.setProperty("--x", `${x.toFixed(2)}%`);
              card.style.setProperty("--y", `${y.toFixed(2)}%`);
            });
          };

          card.addEventListener("pointermove", handlePointerMove);

          manualCleanups.push(() => {
            window.cancelAnimationFrame(frame);
            card.removeEventListener("pointermove", handlePointerMove);
          });
        });
      });

      const refresh = () => ScrollTrigger.refresh();
      const refreshSoon = () => window.requestAnimationFrame(refresh);

      window.addEventListener("load", refreshSoon, { once: true });
      void document.fonts?.ready.then(refreshSoon);

      const images = Array.from(document.images);
      images.forEach((image) => {
        if (!image.complete) {
          image.addEventListener("load", refreshSoon, { once: true });
          image.addEventListener("error", refreshSoon, { once: true });
        }
      });

      refreshSoon();

      cleanup = () => {
        window.removeEventListener("load", refreshSoon);
        images.forEach((image) => {
          image.removeEventListener("load", refreshSoon);
          image.removeEventListener("error", refreshSoon);
        });
        manualCleanups.forEach((manualCleanup) => manualCleanup());
        ctx.revert();
        media.revert();
      };
    }

    void initializeAnimations();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [pathname]);

  return children;
}
