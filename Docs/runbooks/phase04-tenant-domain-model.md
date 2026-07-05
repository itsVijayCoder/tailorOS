# Phase 04 Completion Report - Tenant Domain Model

Prepared: 2026-07-05

## Completed

- Analyzed the TailorOS final PRD, WhatsApp Chat Connector PRD, Cloudflare stack guide, and Phase 04 tenant domain model specification.
- Added shared tenant-domain contracts in `packages/core` and `packages/schemas` for contacts, profiles, measurements, orders, order items, payment ledger entries, search, audit, and outbox events.
- Extended stable TailorOS entity ID prefixes for contacts, garments, measurements, snapshots, payments, receipts, WhatsApp events, outbox rows, and audit records.
- Added the per-tenant D1 migration `apps/tenant-api-template/migrations/0001_tenant_domain.sql` with contact, profile, garment, measurement, order, payment, receipt, media, notification, WhatsApp, outbox, audit, and search tables.
- Seeded garment types with versioned measurement schema JSON so garment-specific measurement capture can evolve without overwriting historical customer values.
- Added tenant-local search projection through `search_docs` plus `search_docs_fts`, keeping global customer discovery tenant isolated.
- Implemented a repository and service layer for the core Phase 04 workflows: contact/profile creation, measurement version creation, order booking with measurement snapshots, and payment recording.
- Enforced the key domain invariants in service code instead of leaving them to UI conventions: mobile is a contact channel, profiles are explicit, measurement versions are immutable, order snapshots preserve old values, and payment corrections require a reason.
- Added tenant-domain API routes in `apps/tenant-api-template/src/app.ts`:
  - `POST /v1/contacts`
  - `POST /v1/measurements`
  - `POST /v1/orders`
  - `POST /v1/orders/:orderId/payments`
  - `GET /v1/search`
- Kept WhatsApp behavior decoupled from TailorOS by writing outbox events for order, receipt, payment, and status workflows instead of calling a provider from the tenant API.
- Added audit records for all implemented mutating workflows.
- Added the `/admin/domain-model` cockpit with TailorOS design-system tokens, dense operational cards, animated route entry, schema coverage, invariant coverage, API surface, and edge-case status.
- Verified the domain cockpit in a real browser at desktop and mobile widths.

## Edge-Case Coverage

| Edge case                                            | Status                        | Implementation                                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One mobile number maps to many people                | Covered                       | `customer_contacts` owns phone details while `customer_profiles` stores explicit people under that contact. Service tests create multiple profiles for one mobile number. |
| Phone number is not customer identity                | Covered                       | Orders and measurements require `customer_profile_id`; phone is searchable contact metadata only.                                                                         |
| Duplicate profile under the same contact             | Covered for creation          | The contact/profile service rejects duplicate normalized profile labels per contact. A merge workflow remains future work.                                                |
| Measurement update must preserve history             | Covered                       | New values create `measurement_versions`; existing versions are not overwritten.                                                                                          |
| Old orders must keep old measurements                | Covered                       | Order booking writes `order_measurement_snapshots` from the selected measurement version.                                                                                 |
| Order with no measurement needed                     | Covered                       | Order items can be booked without a measurement version only when an explicit snapshot reason is supplied.                                                                |
| Multi-garment orders                                 | Covered                       | `orders` and `order_items` are separate; each item can carry its own garment type, quantity, status, and snapshot.                                                        |
| Partial fulfillment                                  | Schema covered                | Item statuses allow partial progress and delivery. Dedicated status-transition service and UI are still pending.                                                          |
| Payment correction or refund                         | Covered                       | Refunds and corrections require a reason; ledger totals are recalculated and audit rows are written.                                                                      |
| WhatsApp send failure should not block order booking | Covered at boundary           | TailorOS writes outbox events only. Provider dispatch, retry, and delivery callbacks belong to the connector/consumer phases.                                             |
| WhatsApp opt-in and opt-out                          | Data model covered            | Notification and WhatsApp log tables exist. Explicit opt-in/out command workflow remains pending.                                                                         |
| Photos and attachments                               | Metadata covered              | `media_assets` stores R2 object metadata and ownership links. Upload, signed URL, and lifecycle workflows remain pending.                                                 |
| Tenant-local search                                  | Covered                       | Search projections and FTS tables are tenant-local inside each tenant D1 database. Rebuild tooling remains pending.                                                       |
| Auditability                                         | Covered for implemented flows | Contact, measurement, order, and payment services write audit records with actor, action, entity, and summary metadata.                                                   |
| Idempotent external requests                         | Foundation covered            | `idempotency_keys` table exists in the tenant schema. Route-level idempotency middleware remains pending.                                                                 |

## Verification

- `pnpm --filter @tailoros/core typecheck`
- `pnpm --filter @tailoros/schemas typecheck`
- `pnpm vitest run packages/core/src/core.test.ts packages/schemas/src/api.test.ts packages/schemas/src/domain.test.ts`
- `pnpm --filter @tailoros/tenant-api-template typecheck`
- `pnpm vitest run apps/tenant-api-template/src/tenant-domain.test.ts`
- `pnpm vitest run apps/tenant-api-template/src/app.test.ts apps/tenant-api-template/src/tenant-domain.test.ts`
- `pnpm --filter @tailoros/web typecheck`
- `pnpm --filter @tailoros/web lint`
- Browser verification for `/admin/domain-model` on the existing local Next server at `http://localhost:3000`.
- Visual QA screenshots:
  - `output/playwright/phase04-domain-model.png`
  - `output/playwright/phase04-domain-model-mobile.png`

## Remaining Production Work

- Connect Phase 04 tenant migrations to the Phase 03 provisioning worker so every newly created tenant database receives the domain schema automatically.
- Add route-level idempotency handling for all mutating tenant API endpoints using the `idempotency_keys` table.
- Add authenticated tenant-user context and RBAC checks before enabling the tenant-domain API outside development.
- Implement status-transition services for order items, production tasks, partial delivery, cancellation, and reopening.
- Implement media upload workflows with R2 signed upload URLs, virus/type validation policy, and lifecycle cleanup.
- Add receipt rendering, receipt share tokens, and receipt revision policy.
- Add search projection rebuild tooling for schema migrations, data repair, and future ranking changes.
- Add the outbox queue consumer that reads tenant outbox rows and calls the reusable WhatsApp connector.
- Add opt-in, opt-out, delivery receipt, inbound message, and shared-mobile disambiguation workflows.
- Replace static `/admin/domain-model` implementation status data with live tenant/admin health data once authenticated admin APIs are available.
- Add staging integration tests against real Cloudflare D1, Queues, and R2 bindings after deployment credentials are configured.

## Notes

- Phase 04 intentionally keeps provider-specific WhatsApp template, policy, and delivery behavior outside the tenant API. The tenant API owns business events and auditability; the connector owns provider execution.
- The D1 migration uses explicit indexes and tenant-local FTS rather than cross-tenant search infrastructure, matching the per-tenant isolation model from the Cloudflare stack guide.
- The UI follows the Phase 02 design-system contract: semantic TailorOS tokens, Cormorant Garamond for display/reference headings, Inter for operational copy, stable layouts, and reduced-motion-safe route animation.
