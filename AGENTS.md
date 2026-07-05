<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- bm-design-system:start -->

## Design system

This codebase has a design-system reference at `/admin/design-system`. The page previews the current TailorOS tokens, primitives, motion rules, and dark-mode behavior.

When implementing UI:

1. Check `/admin/design-system` before writing frontend markup or styles. Use the existing tokens (`bg-page`, `bg-surface`, `border-hairline`, `text-ink-body`, `text-ink-display`, `text-ink-muted`, `bg-accent`, `bg-signal`) and primitives under `apps/web/components/ui/`.

2. Do not invent ad-hoc visual systems. Avoid raw hex values and one-off Tailwind color utilities when a semantic token exists. If a missing primitive is needed, add it to `apps/web/components/ui/` and document it on `/admin/design-system`.

3. Keep operational screens dense, scannable, and calm. TailorOS is a shop operating system, so prioritize fast search, clear customer/order identity, visible status, compact lists, and repeated counter workflows over marketing-style sections.

4. Use restrained micro-interactions. Prefer transform and opacity transitions, keep layout stable, and respect reduced-motion preferences.

5. Re-run the `bm-design-system` skill when expanding the design system in Phase 02 or refreshing tokens.

<!-- bm-design-system:end -->
