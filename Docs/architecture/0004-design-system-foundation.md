# ADR 0004: TailorOS Design-System Baseline

## Status

Accepted

## Context

The app needs a premium but practical operating UI for dense counter workflows, owner dashboards, order state, payments, and WhatsApp delivery feedback. Phase 01 now also needs a sellable marketing surface, design-system reference, route transitions, and reusable motion primitives without weakening the single-source theme contract.

## Decision

Keep Tailwind v4 semantic tokens as the visual contract and expose a reference page at `/admin/design-system`. The global theme contract lives in `apps/web/app/globals.css` using shadcn-style CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, chart tokens, sidebar tokens, and TailorOS status extensions such as `--warning` and `--success`.

The TailorOS Phase 01 palette is deep ink by default with warm ivory foregrounds, antique gold primary actions, copper accents, subtle grain, radial light, and glassy card surfaces. The light theme uses the matching warm atelier tokens for documentation and operator contexts that need a brighter surface.

Only `globals.css` may define raw palette values. Application UI, app-authored docs, and reusable components must consume semantic Tailwind utilities such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-warning`, and `text-warning-foreground`. The web lint command runs `pnpm theme:check` to block raw palette utilities, arbitrary color utilities, and legacy TailorOS aliases outside the global theme file.

The reusable premium layer lives under `apps/web/components/premium` and includes `Container`, `Section`, `SectionHeading`, `PremiumButton`, `PremiumCard`, `GlassCard`, `AnimatedBadge`, `MagneticButton`, `ImageReveal`, `Marquee`, `ScrollProgress`, `PageTransitionOverlay`, `MobileMenu`, `StickyFeatureShowcase`, `HorizontalScrollSection`, `TestimonialCard`, `CTASection`, and `TransitionLink`. Page files should compose these primitives instead of repeating one-off section styling.

The motion runtime is client-only. `SmoothScrollProvider` initializes Lenis with a `requestAnimationFrame` loop, connects Lenis scroll updates to GSAP `ScrollTrigger`, and respects reduced motion. `AnimationProvider` registers GSAP only in the browser, uses `gsap.context` cleanup, animates `[data-reveal]`, `[data-stagger]`, `[data-parallax]`, `[data-horizontal]`, `.image-reveal`, `[data-magnetic]`, and `.premium-card` glow interactions, then refreshes ScrollTrigger after fonts and images load.

Route transitions use a small Zustand store, `TransitionLink`, and `PageTransitionOverlay`. Internal route clicks animate a deep-ink overlay and antique-gold hairline before navigation; reduced-motion users navigate immediately.

Dark mode is class-based on `<html>` and persisted with `localStorage["bm-ds-theme"]`. TailorOS defaults to dark luxury when no preference has been saved. A root-layout boot script applies the saved theme before paint.

## Consequences

Future UI work has a reference route, primitive import path, token scanner, and motion contract before the full Phase 02 component library lands. This prevents ad-hoc styling drift while keeping Phase 01 aligned with senior-level architecture, visual polish, and accessibility expectations.
