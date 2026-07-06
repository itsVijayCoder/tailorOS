# Phase 09 Testing, Observability, QA and Release Implementation

Updated: July 6, 2026

## Source Documents Reviewed

- `Docs/TailorOS_Final_PRD.html`
- `Docs/Whatsapp_Chat_Final_PRD.html`
- `Docs/Tech-stack/TailorOS_CF_Stack_Implementation_Guide.html`
- `Docs/Phase-Wise/Phase09_testing_observability_release.html`
- Existing design-system reference at `/admin/design-system`
- Local Next.js 16 docs under `apps/web/node_modules/next/dist/docs/`
- Cloudflare Workers best practices: `https://developers.cloudflare.com/workers/best-practices/workers-best-practices/`
- Cloudflare Workers Logs: `https://developers.cloudflare.com/workers/observability/logs/workers-logs/`
- Cloudflare Workers Vitest integration: `https://developers.cloudflare.com/workers/testing/vitest-integration/`

## Deep Analysis Summary

Phase 09 is the release-control phase. The source documents do not just ask for more tests; they require a verification system that keeps tenant identity, family/customer selection, money, measurements, WhatsApp delivery, Worker deployments, D1 migrations, DLQs, and pilot readiness observable before production traffic is trusted.

The TailorOS PRD makes search-first counter workflows, shared mobile numbers, measurement snapshots, partial delivery, and payment corrections core product risks. The WhatsApp Connector PRD adds idempotency, duplicate/stale webhook handling, opt-out safety, provider signature verification, DLQs, and credential separation. The Cloudflare stack guide pushes this into a Cloudflare-first release model: Workers, per-tenant D1, queues, DLQs, structured logs, runtime metadata, staging/prod separation, and runbooks for operational failure.

This implementation completed the shared Phase 09 foundations and the operator-facing release cockpit. It intentionally does not mark the product production-ready yet: Playwright smoke, Cloudflare Workers Vitest pool, staging migration automation, production deploy gates, and post-deploy smoke remain visible blockers in the UI until wired to real CI/CD and Cloudflare environments.

## Completed

- Added `@tailoros/test-utils` with deterministic TailorOS fixture factories:
  - tenant, contact, customer profile, measurement profile, measurement version, order, payment, and WhatsApp webhook factories.
  - shared fixture loader helpers for JSON fixtures.
- Added Phase 09 fixture records:
  - `family-one-mobile-four-profiles.json`
  - `duplicate-mobile-variants.json`
  - `partial-delivery-order.json`
  - `payment-correction-case.json`
  - `whatsapp-duplicate-webhook.json`
  - `whatsapp-out-of-order-status.json`
- Added `packages/worker-runtime/src/observability.ts` with reusable Worker release and telemetry helpers:
  - runtime metadata reader.
  - release-version resolver.
  - structured log entry builder.
  - JSON log emitter.
  - health payload builder.
  - alert evaluation for release-critical metrics.
  - release-readiness summary helper.
- Updated the shared Worker HTTP error handler to emit structured JSON error logs with request, route, tenant, user, worker, environment, release version, and duration context.
- Added Phase 09 web data models and typed fixtures for:
  - testing pyramid layers.
  - fixture coverage.
  - structured log fields.
  - observability metrics and alerts.
  - Worker runtime checks.
  - release gates.
  - support runbooks.
  - first-shop go-live checklist.
- Added derived release-signal selectors:
  - `getPhase09ReleaseSignals()`
  - `getPhase09BlockingReleaseGates()`
  - `getPhase09RunbookCoverage()`
- Added `/shop/release` as the Phase 09 testing, observability, QA, and release cockpit.
- Added `Release` to the shop shell navigation.
- Improved shared shop shell/mobile containment so horizontally scrollable module navs and wide operational tables do not create page-level horizontal overflow.
- Improved module primitives with `min-w-0` containment for cards and data panels used inside responsive grids.
- Extended feature tests to cover Phase 09 release signals, blocker ordering, fixture/log-field coverage, runbook coverage, DLQ visibility, and pilot go-live blockers.

## UI Notes

- The route is server-rendered and uses the existing TailorOS module primitives: `PageHeader`, `MetricCard`, `DataPanel`, `SectionHeader`, and `StatusBadge`.
- The screen follows the design-system contract from `/admin/design-system`: semantic Tailwind tokens, Cormorant Garamond display hierarchy, Inter operational copy, compact tables, restrained shadows, and transform/background micro-interactions.
- The UI is intentionally operational, not decorative. It shows release status, blockers, metrics, logs, fixtures, Worker runtime checks, runbooks, and pilot readiness in one cockpit.
- Blocking gates are visually loud because they should stop manual production approval.
- Wide test/metric tables scroll inside their own containers on mobile; the document itself no longer horizontally scrolls at 390px.

## Edge-Case Coverage

| Edge case | Status |
| --- | --- |
| Shared family mobile with four customer profiles | Covered by fixture and factory tests. |
| Duplicate mobile variants such as `+91`, leading zero, spaces, and `0091` | Covered by fixture and factory tests. |
| Partial delivery where item status differs from order status | Covered by fixture and Phase 09 fixture registry. |
| Payment correction requiring reason and audit owner | Covered by fixture and factory tests. |
| Duplicate WhatsApp webhook retry | Covered by fixture and webhook factory test. |
| Out-of-order WhatsApp status update | Covered by fixture and release cockpit data. |
| Worker error log lacks tenant/request/user/route/version context | Covered by worker-runtime observability tests. |
| Critical DLQ count above zero | Visible as a blocking alert in `/shop/release`. |
| Production approval before smoke/deploy gates are green | Blocked by release-gate fixtures and tests. |
| First-shop pilot without notebook comparison | Blocked by pilot go-live checklist. |
| Mobile release cockpit overflow at 390px | Found in rendered QA and fixed with shell/table containment. |

## Verification

- `pnpm --filter @tailoros/worker-runtime typecheck` passed.
- `pnpm --filter @tailoros/test-utils typecheck` passed.
- `pnpm --filter @tailoros/web typecheck` passed.
- `pnpm --filter @tailoros/web lint` passed, including `theme:check`.
- `pnpm test -- packages/worker-runtime/src/http.test.ts packages/test-utils/src/factories.test.ts` passed.
- `pnpm test -- apps/web/features/core-modules/core-modules.test.ts` passed: 15 files, 90 tests.
- `pnpm test` passed: 15 files, 90 tests.
- `pnpm typecheck` passed: 12 packages successful.
- `pnpm lint` passed: 12 packages successful.
- `pnpm build` passed: 12 packages successful; Next.js statically generated `/shop/release`.

## Rendered QA

- Dev server: existing Next.js dev server on `http://localhost:3000`.
- URL checked: `http://localhost:3000/shop/release`.
- Browser path: in-app Browser backend was unavailable (`agent.browsers.list()` returned `[]`), so Playwright CLI fallback was used.
- Page identity passed: URL `/shop/release`, title `Testing, Observability and Release`.
- Desktop viewport checked: 1280 x 720, screenshot saved to `output/playwright/phase09-release-desktop.png`.
- Mobile viewport checked: 390 x 844, screenshot saved to `output/playwright/phase09-release-mobile-fixed.png`.
- Mobile layout assertion passed: `innerWidth=390`, `documentElement.scrollWidth=390`, `body.scrollWidth=390`.
- Console health passed: 0 browser errors and 0 warnings. Normal Next.js/React development logs appeared only as dev messages.
- Framework overlay check passed: no Next.js error overlay was present. The small Next dev indicator appears in dev screenshots only.

## Still Needed

- Wire Cloudflare Workers Vitest pool for Hono routes, bindings, D1, R2, queues, and DLQ behavior.
- Add Playwright smoke specs for the first-shop journey: create family, select profile, create measurement, book order, record payment, generate receipt, and trigger WhatsApp send.
- Add GitHub Actions or equivalent CI once repository deployment conventions and secrets are defined.
- Inject `RELEASE_VERSION` during deploy for every Worker and the web app.
- Provision separate staging and production Cloudflare resources and lock down production deploy permissions.
- Implement staging tenant migration fan-out with per-tenant status and rollback/repair reporting.
- Add post-deploy smoke endpoints for health, tenant dispatch, D1 query, queue enqueue, and WhatsApp connector checks.
- Wire real log sinks/dashboards for API error rate, search p95, D1 rows, provisioning failures, invalid webhook signatures, and DLQ count.
- Add release approval workflow that fails closed when any blocking gate is present.
- Import pilot shop data, train staff, run the two-week notebook comparison, and attach pilot-readiness evidence before onboarding additional shops.
