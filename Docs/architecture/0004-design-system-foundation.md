# ADR 0004: TailorOS Design-System Baseline

## Status

Accepted

## Context

The app needs a premium but practical operating UI for dense counter workflows, owner dashboards, order state, payments, and WhatsApp delivery feedback. The current Phase 00 homepage already uses semantic Tailwind v4 tokens.

## Decision

Keep Tailwind v4 semantic tokens as the visual contract and expose a reference page at `/admin/design-system`. The global theme contract lives in `apps/web/app/globals.css` using shadcn-style CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, chart tokens, sidebar tokens, and TailorOS status extensions such as `--warning` and `--success`.

Only `globals.css` may define raw palette values. Application UI, app-authored docs, and reusable components must consume semantic Tailwind utilities such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-warning`, and `text-warning-foreground`. The web lint command runs `pnpm theme:check` to block raw palette utilities, arbitrary color utilities, and legacy TailorOS aliases outside the global theme file.

The initial reusable primitives are `Button`, `Badge`, `Input`, and `ThemeToggle`; Phase 02 can expand this into the full shadcn-style component library.

Dark mode is class-based on `<html>` and persisted with `localStorage["bm-ds-theme"]`. A root-layout boot script applies the saved theme before paint.

## Consequences

Future UI work has a reference route and primitive import path before the full Phase 02 component library lands. This prevents ad-hoc styling drift while keeping Phase 01 focused on architecture rather than overbuilding UI components.
