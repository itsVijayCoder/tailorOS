# Phase 08 Security, Privacy, RBAC and Tenant Isolation Implementation

Updated: July 6, 2026

## Source Documents Reviewed

- `Docs/TailorOS_Final_PRD.html`
- `Docs/Whatsapp_Chat_Final_PRD.html`
- `Docs/Tech-stack/TailorOS_CF_Stack_Implementation_Guide.html`
- `Docs/Phase-Wise/Phase08_security_privacy_rbac.html`
- Existing design-system reference at `/admin/design-system`
- Local Next.js 16 docs under `apps/web/node_modules/next/dist/docs/`

## Deep Analysis Summary

Phase 08 is a trust-boundary phase. The source documents agree on the non-negotiable rule: one shop must never read another shop's customers, measurements, receipts, WhatsApp messages, exports, credentials, or support/audit history.

The TailorOS PRD requires roles to protect payments, exports, settings, credentials, and support access. The WhatsApp Connector PRD requires credential vaulting, raw-token suppression, tenant-scoped channel accounts, provider webhook verification, consent/opt-out enforcement, and support audit evidence. The Cloudflare stack guide reinforces the architecture: resolve tenant from trusted domain/path plus authenticated membership, dispatch only to that tenant's Worker/D1 binding, keep provider secrets out of the browser, use signed R2 access, and audit sensitive actions.

The current codebase already has some Phase 08-adjacent protections:

- API gateway slug validation before tenant dispatch.
- Active tenant plus healthy worker mapping check before tenant API invocation.
- Tenant API validation for search length and payment-correction reasons.
- WhatsApp connector internal service token guard for admin/send routes.
- WhatsApp webhook verify-token hash and Meta HMAC signature validation.
- WhatsApp idempotency, retry, DLQ, opt-out, and status-rank logic from Phase 06.

The missing production boundary is real staff authentication/session membership around live tenant data. This phase implements the shared RBAC/security policy model and the operator UI honestly, without pretending a session provider exists.

## Completed

- Added `packages/core/src/security.ts` with reusable Phase 08 security policy utilities:
  - TailorOS role list.
  - Permission list.
  - Role-to-permission matrix.
  - Tenant membership and active-tenant authorization decision.
  - Platform support access checks for tenant scope, reason, active grant, and expiry.
  - Signed receipt/media/export access evaluation.
  - Sensitive audit-action classification.
  - Credential identifier masking and public credential DTO creation.
- Exported the security utilities from `@tailoros/core`.
- Added `packages/core/src/security.test.ts` covering cross-tenant denial, tailor/counter restrictions, support scope expiry, credential masking, signed-link expiry/confirmation, and audit-required actions.
- Added Phase 08 typed web DTOs and fixtures for:
  - RBAC role rows.
  - Tenant isolation checks.
  - Credential vault records with masked identifiers only.
  - R2 receipt/media/export signed access cases.
  - Public endpoint hardening controls.
  - Scoped support access cases.
  - Audit coverage rows.
- Added `getPhase08SecuritySignals()` to derive the security cockpit metrics from the same fixtures used by the page.
- Added `/shop/security` as the Phase 08 security, privacy, RBAC, and tenant-isolation cockpit.
- Added the Security module to the existing shop shell navigation.
- Extended `apps/web/features/core-modules/core-modules.test.ts` with Phase 08 signal, role, credential masking, support access, receipt link, and tenant isolation assertions.

## UI Notes

- The route is server-rendered and uses the existing TailorOS design-system contract.
- The UI uses semantic tokens and primitives already present in the codebase: `bg-page`, `bg-surface`, `bg-surface-strong`, `border-hairline`, `text-ink-body`, `text-ink-display`, `text-ink-muted`, `bg-accent`, `bg-signal`, `Button`, `MetricCard`, `DataPanel`, and `StatusBadge`.
- The screen stays operational and dense: authorization pipeline, tenant isolation checks, role matrix, credential vault, support access, R2/signed links, endpoint controls, audit coverage, and launch checklist.
- Transitions are limited to transform, opacity, border, and background changes, respecting the existing reduced-motion approach.

## Edge-Case Coverage

| Edge case                                                                          | Status                                                    |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Valid role tries another tenant's data                                             | Covered by core authorization test.                       |
| Tailor opens reports or exports                                                    | Covered by role matrix and feature test.                  |
| Counter staff attempts payment correction/export                                   | Covered by core denied-permission test.                   |
| Platform support lacks tenant scope                                                | Covered by core and feature tests.                        |
| Platform support grant expired                                                     | Covered by core and feature tests.                        |
| Raw WhatsApp token/IDs exposed in UI DTO                                           | Covered by credential masking tests.                      |
| Invalid receipt/media signature                                                    | Covered by core signed-access test.                       |
| Expired receipt link                                                               | Covered by core and feature tests.                        |
| Link requires order-code/mobile confirmation                                       | Covered by core signed-access test.                       |
| Sensitive payment, measurement, export, credential, and support actions need audit | Covered by core audit classification and UI fixtures.     |
| Tenant dispatch to suspended tenant                                                | Already covered by API gateway tests from earlier phases. |
| Invalid WhatsApp webhook signature                                                 | Already covered by Phase 06 connector tests.              |

## Verification

- `pnpm --filter @tailoros/core typecheck` passed.
- `pnpm test packages/core/src/security.test.ts apps/web/features/core-modules/core-modules.test.ts` passed: 2 files, 22 tests.
- `pnpm --filter @tailoros/web typecheck` passed.
- `pnpm --filter @tailoros/web lint` passed, including `theme:check`.
- `pnpm test` passed: 14 files, 78 tests.
- `pnpm typecheck` passed: 11 packages successful.
- `pnpm lint` passed: 11 packages successful.
- `pnpm build` passed: 11 packages successful; Next.js statically generated `/shop/security`.
- `pnpm format` still fails because pre-existing files from earlier phases are not Prettier-formatted. Phase 08 touched files were formatted with `pnpm exec prettier --write ...`.

## Rendered QA

- Dev server: `pnpm --filter @tailoros/web dev`
- URL checked: `http://localhost:3000/shop/security`
- Browser path: in-app Browser runtime was present, but no `iab` backend was available and `agent.browsers.list()` returned `[]`; Playwright CLI fallback was used.
- Desktop viewport: 1280 x 720, screenshot saved to `output/playwright/phase08-security-desktop.png`.
- Mobile viewport: 390 x 844, screenshot saved to `output/playwright/phase08-security-mobile.png`.
- Page identity passed: URL `/shop/security`, title `Security, Privacy and RBAC`.
- Nonblank check passed: DOM snapshot included TailorOS shell, Phase 08 hero, metrics, pipeline, RBAC table, and nav.
- Framework overlay check passed: no Next.js error overlay was present. The small Next dev indicator appears in dev screenshots only.
- Console health passed: only normal React DevTools, HMR, and Fast Refresh dev logs appeared.
- Interaction proof passed: clicking `Phase 08 source` navigated to `/docs/phase-wise/Phase08_security_privacy_rbac.html` with title `Phase 08 — Security, Privacy, RBAC & Tenant Isolation`.
- UI issue found and fixed: the initial desktop metric grid switched to four columns too early inside the shop shell and clipped the fourth card at 1280px. The Phase 08 page now uses a 2xl breakpoint for four metric columns.

## Still Needed

- Add a real staff authentication/session provider.
- Add a control-plane membership repository and wire membership checks into live tenant-data routes.
- Add route/action guards to tenant API mutations once the request context carries authenticated user, role, tenant, and support grant.
- Persist D1 audit rows for sensitive actions instead of only modeling the policy.
- Encrypt tenant WhatsApp credentials at rest and wire rotation metadata into the connector D1 schema.
- Implement owner-only tenant export and privacy delete/anonymization workers with short-lived R2 links.
- Add Turnstile and rate limiting to signup/login once those routes exist.
- Add production support-access start/end APIs with reason, expiry, actor, request ID, and audit rows.
- Add R2 lifecycle policies for raw WhatsApp payloads, receipt exports, and generated media.
- Add rendered browser QA screenshots for `/shop/security` after the dev server and Playwright/browser runtime are available.
