"use client";

import type { ReactNode } from "react";

import { AnimationProvider } from "@/components/motion/animation-provider";
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll-provider";
import { PageTransitionOverlay } from "@/components/premium/page-transition-overlay";
import { ScrollProgress } from "@/components/premium/scroll-progress";

type ClientProvidersProps = {
  children: ReactNode;
};

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SmoothScrollProvider>
      <AnimationProvider>
        <ScrollProgress />
        <PageTransitionOverlay />
        {children}
      </AnimationProvider>
    </SmoothScrollProvider>
  );
}
