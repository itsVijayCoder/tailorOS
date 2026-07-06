# Phase 05 Core Modules Implementation

Date: 2026-07-06

## Source Analysis

Phase 05 combines the TailorOS product PRD, WhatsApp Connector PRD, Cloudflare stack guide, and the phase-specific implementation report. The consistent product decision across all sources is that TailorOS must first become a reliable shop operating system. WhatsApp is an amplification layer and must not compensate for weak customer, measurement, order, production, payment, or receipt records.

The core identity rule is unchanged from the PRD: a mobile number is a contact channel, not a customer identity. One shared mobile number can contain several family customer profiles, and staff must choose the exact profile before measurements or orders appear. That rule drives the Phase 05 UI, search behavior, validation, and pilot acceptance tests.

The technical boundary from the Cloudflare guide is also preserved. Tenant-specific operational data belongs in a per-tenant D1 database, while TailorOS emits business events through outbox and notification logs. Provider credentials, template execution, webhook delivery, opt-out policy, and usage cost evidence belong to the separate WhatsApp Connector.

## Phase 05 Scope

The phase needs a pilot-ready operating cockpit with these modules:

- Dashboard and command search for due work, overdue work, ready items, balances, failed messages, and blocked tailors.
- Customer and family module with fast mobile/name/ID search, duplicate warnings, family disambiguation, profile cards, and timeline.
- Measurement center with garment templates, unit clarity, versioning, diff review, fit notes, and photo upload readiness.
- Order book and new order wizard with exact profile selection, multi-item orders, measurement snapshots, item overrides, draft protection, dates, pricing, advance payment, receipt generation, and optional WhatsApp event.
- Production board with explicit status lanes, task assignment, due dates, alteration logs, and delay reasons.
- Payments, receipts, and reports with ledger entries, corrections with reasons, signed receipt-link readiness, collections, pending balance, workload, overdue delivery, and WhatsApp failure views.
- Settings for shop profile, receipt branding, roles, garment templates, status workflow, notification policy, and WhatsApp integration state.

## Implementation Decisions

- Build UI as Next.js App Router screens under `apps/web/app/shop` to avoid colliding with the existing landing page at `/`.
- Keep route pages server-first and move only command/search interactions into small client components.
- Use existing TailorOS tokens and primitives from `apps/web/components/ui`; do not introduce raw color systems.
- Back the pilot UI with typed fixture data and pure helper functions in `apps/web/features/core-modules` so the screens can later wire to the tenant API without a rewrite.
- Align UI states with existing backend/domain contracts in `@tailoros/core`, `@tailoros/schemas`, and `apps/tenant-api-template`.
- Treat Phase 05 as frontend/product workflow implementation on top of the Phase 04 tenant APIs; full tenant API list/read endpoints remain a follow-up.

## Critical Edge Cases

- Same mobile number has multiple family members with similar names.
- Mobile input can be `09876543210`, `9876543210`, `+91 9876543210`, or spaced input.
- Duplicate profile creation requires a warning and override reason.
- Trial date can exist without an exact time.
- A single order can have one item ready and another still stitching.
- Measurement changes create a new version and do not mutate old order snapshots.
- Important measurement changes require a reason.
- Order-specific measurement overrides do not replace the permanent profile measurement.
- Balance due must include advances, balance payments, refunds, and corrections.
- Payment corrections and refunds require an audit reason.
- Opted-out WhatsApp failures are blocked actions and should not be retryable.
- Every operational screen needs usable empty, loading, and error-state affordances before pilot.
- Mobile layout must support one-handed counter use.

## Acceptance Checklist

- A shop owner can understand today delivery, overdue items, ready pickup, blocked tasks, balances, and WhatsApp failures in under 30 seconds.
- Counter staff can search first, select an exact profile, and start an order without choosing a module first.
- Measurement screens make garment, unit, version, and change reason visible.
- Order entry exposes required identity, item, measurement, date, price, payment, and receipt steps.
- Production lanes show owner-visible delay reasons and tailor ownership.
- Payments are ledger-based and corrections are auditable.
- Receipt and notification UI do not embed WhatsApp provider logic.
- Reports lead to action, not just totals.

## Completed

- Added the Phase 05 shop operating console at `/shop`.
- Added module routes:
  - `/shop` dashboard and command-search cockpit.
  - `/shop/customers` family-aware customer lookup and profile disambiguation.
  - `/shop/measurements` garment templates, capture skeleton, version diff, and R2 photo-upload boundary.
  - `/shop/orders` order book and counter-speed wizard structure.
  - `/shop/production` production board, status lanes, task ownership, and alteration logs.
  - `/shop/payments` append-only ledger and printable receipt snapshots.
  - `/shop/reports` action-oriented owner reports.
  - `/shop/settings` pilot configuration, roles, receipt, templates, and WhatsApp boundary.
- Added a stable shop shell in `apps/web/features/core-modules/components/core-modules-shell.tsx`.
- Added `Ctrl/Cmd+K` command search in `apps/web/features/core-modules/components/core-command-menu.tsx`.
- Added typed Phase 05 fixtures and pure helpers in `apps/web/features/core-modules/data.ts`.
- Added presenter helpers for statuses, dates, and badge tone mapping in `apps/web/features/core-modules/presenters.ts`.
- Added focused tests in `apps/web/features/core-modules/core-modules.test.ts`.
- Kept UI aligned with TailorOS design-system tokens and primitives from `apps/web/components/ui`.

## Edge Case Coverage

- Shared mobile search is normalized and returns the family group before individual profiles.
- Similar-name family members are visible with relation labels and customer codes.
- Duplicate profile risk is shown with an override-reason requirement.
- Trial date without exact time is still visible in the dashboard and order book.
- Partial delivery is shown at item level; mixed readiness cannot be hidden by the order status.
- Measurement version diff exposes changed fields, actor, unit, and reason.
- Order-specific measurement override is displayed separately from the permanent measurement version.
- Payment balance is derived from advance, refund, and correction rows.
- Correction and refund rows expose reasons instead of silently mutating payment state.
- Opted-out WhatsApp failures are not retryable; provider failures remain retryable.
- Settings explicitly keep WhatsApp provider credentials outside TailorOS.

## Verification

- `pnpm test` passed with 9 test files and 39 tests.
- `pnpm --filter @tailoros/web lint` passed, including the theme-token check.
- `pnpm --filter @tailoros/web typecheck` passed.
- `pnpm --filter @tailoros/web build` passed and generated the `/shop` route tree.
- Playwright smoke check passed for `/shop` desktop and mobile layouts.
- Playwright command-search check passed for shared mobile query `09876543210`.

## History

- Work was committed as separate documentation, implementation, completion-summary, and UI-polish commits to keep the history reviewable.

## Remaining Work

- Connect `/shop` screens to tenant API list/read endpoints after the backend exposes production read models.
- Add authenticated role checks and route guards before using these screens with real staff.
- Add mutation flows for order status updates, payment recording, measurement saves, and receipt generation.
- Add real loading, empty, and error states once server state is wired through the API layer.
- Persist local order drafts with conflict handling and explicit discard/restore UX.
- Add R2 signed upload integration for measurement photos and receipt snapshots.
- Add signed public receipt links with expiry policy.
- Add exports only after owner/manager authorization and audit logging are enforced.
- Add visual browser QA screenshots for desktop and mobile once the development server is running.
