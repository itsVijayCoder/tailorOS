# ADR 0004: TailorOS Design-System Baseline

## Status

Accepted

## Context

The app needs a premium but practical operating UI for dense counter workflows, owner dashboards, order state, payments, and WhatsApp delivery feedback. Phase 02 adds the reusable operating primitives, TailorOS-specific business UI examples, light-golden token aliases, and micro-interaction rules needed before feature screens multiply.

## Decision

Keep Tailwind v4 semantic tokens as the visual contract and expose a reference page at `/admin/design-system`. The global theme contract lives in `apps/web/app/globals.css` using shadcn-style CSS variables plus TailorOS aliases such as `--page`, `--surface`, `--surface-strong`, `--hairline`, `--ink-body`, `--ink-display`, `--ink-muted`, `--accent-faded`, `--signal`, `--state-success`, `--state-danger`, and WhatsApp delivery tokens.

The TailorOS Phase 02 palette is light-golden by default for shop-counter legibility, with dark mode available through the class-based theme toggle. The theme still supports premium warm surfaces, antique gold primary actions, signal highlights, semantic status colors, subtle grain, radial light, and glassy card surfaces.

The typography contract pairs Cormorant Garamond and Inter. Cormorant Garamond is loaded through `next/font/google` as `--font-heading` and exposed as `font-display` for page titles, section titles, card/dialog headings, and design-system reference headings. Inter remains the interface and body face through `font-ui`, `font-sans`, and inherited body text for labels, controls, data, numbers, tables, dense lists, and operational copy.

Only `globals.css` may define raw palette values. Application UI, app-authored docs, and reusable components must consume semantic Tailwind utilities such as `bg-page`, `bg-surface`, `border-hairline`, `text-ink-body`, `text-ink-display`, `text-ink-muted`, `bg-accent`, `bg-signal`, and the shadcn-compatible aliases where existing Phase 01 surfaces still use them. The web lint command runs `pnpm theme:check` to block raw palette utilities and arbitrary color utilities outside the global theme file.

The reusable premium layer lives under `apps/web/components/premium` for the current landing experience. The Phase 02 operating primitives live under `apps/web/components/ui` and include buttons, forms, cards, dialog, dropdown menu, search field, skeleton, callout, and status chip. TailorOS business presentation components live under `apps/web/components/tailoros` and include customer profile chips, measurement fields, order status timelines, receipt previews, and WhatsApp delivery badges.

The motion runtime is client-only. `SmoothScrollProvider` initializes Lenis with a `requestAnimationFrame` loop, connects Lenis scroll updates to GSAP `ScrollTrigger`, and respects reduced motion. `AnimationProvider` registers GSAP only in the browser, uses `gsap.context` cleanup, animates `[data-reveal]`, `[data-stagger]`, `[data-parallax]`, `[data-horizontal]`, `.image-reveal`, `[data-magnetic]`, and `.premium-card` glow interactions, then refreshes ScrollTrigger after fonts and images load.

Route transitions use a small Zustand store, `TransitionLink`, `PageTransitionOverlay`, and the App Router `template.tsx` route shell. Internal route clicks animate the overlay before navigation, while route content uses a short opacity/translate transition; reduced-motion users navigate immediately.

Dark mode is class-based on `<html>` and persisted with `localStorage["bm-ds-theme"]`. TailorOS defaults to the light-golden operating theme when no preference has been saved. A root-layout boot script applies the saved theme before paint.

## Consequences

Future UI work has a reference route, primitive import path, token scanner, and motion contract before the full Phase 02 component library lands. This prevents ad-hoc styling drift while keeping Phase 01 aligned with senior-level architecture, visual polish, and accessibility expectations.
