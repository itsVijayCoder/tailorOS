# Phase 00-09 Real Data Workability Gap Analysis

Updated: July 6, 2026

## Executive Summary

Phases 00-09 have built the product architecture, tenant model, domain services, UI cockpits, WhatsApp connector foundation, search model, security policy, observability helpers, and release cockpit. The app is not yet a fully workable real-data product through the browser because the shop UI is still fixture-backed and the live tenant APIs are not yet protected by a real staff session, membership lookup, or public gateway proxy.

The strongest real-data foundation today is the tenant domain Worker. It can already create contacts/family profiles, create immutable measurement versions, book orders with measurement snapshots, record payments/corrections, write receipts, write audit rows, write outbox rows, and search tenant-local D1 projections. The missing product layer is the end-to-end connection: authenticated staff logs in, chooses an active tenant, the web app calls real read/write endpoints, RBAC is enforced, and all workflows render real D1 data instead of `apps/web/features/core-modules/data.ts`.

Use this report as the workback plan to turn Phase 00-09 from implementation foundations into a pilot-ready app for one real shop.

## Current Readiness

| Area | Current state | Real-data readiness |
| --- | --- | --- |
| Phase 00 master plan | Implemented as roadmap/navigation and project contract. | Ready as documentation and strategy. |
| Phase 01 local/dev foundation | Repo builds and Workers dry-run. | Mostly ready, but D1 migrations must be applied to local/staging resources. |
| Phase 02 design system | Strong UI tokens/primitives and `/admin/design-system`. | Ready; keep using these primitives for new forms. |
| Phase 03 control plane | Tenant signup/provisioning model, control D1 schema, admin endpoints, simulated/manual/automated provisioning. | Foundation ready; needs real auth, real migrations, and live admin UI data. |
| Phase 04 tenant domain model | Core D1 schema, services, and tenant API write/search routes exist. | Partially ready; write path exists, read/update/status/media/idempotency are missing. |
| Phase 05 shop modules | Premium shop UI routes exist. | Not real-data ready; pages use typed pilot fixtures and read-only controls. |
| Phase 06 WhatsApp connector | Connector/consumer/policy/provider foundations exist. | Partially ready; needs real connector seeds, secrets, WABA onboarding, and tenant outbox bridge. |
| Phase 07 search/performance | Tenant-local projection and command palette behavior modeled. | Partially ready; command palette still uses pilot fixtures. |
| Phase 08 security/RBAC | Role/permission matrix and authorization policy exist. | Not live yet; no staff auth/session provider or route guards. |
| Phase 09 release/observability | Structured logging helpers, test fixtures, release cockpit, runbooks. | Partially ready; CI/CD, Worker integration tests, Playwright smoke, and real dashboards remain. |

## What Works With Real D1 Data Today

The tenant Worker exposes these real endpoints in `apps/tenant-api-template/src/app.ts`:

| Endpoint | Real workflow support | Important limitation |
| --- | --- | --- |
| `POST /v1/contacts` | Creates one contact/mobile with one or more customer profiles. | Cannot add a new profile to an existing contact yet. |
| `POST /v1/measurements` | Creates or versions a measurement profile for a customer. | No list/detail endpoints for measurement history yet. |
| `POST /v1/orders` | Creates order, items, measurement snapshots, receipt, audit, outbox, and search rows. | No order detail/list endpoint; no real status transition mutation. |
| `POST /v1/orders/:orderId/payments` | Adds ledger row, updates receipt and balance, audits corrections/refunds. | No receipt render/share-token endpoint yet. |
| `GET /v1/search` | Searches tenant-local contact/profile/order/receipt projections. | Web command menu is not wired to it yet. |
| `POST /v1/orders/transition-preview` | Validates order state transition rules. | Preview only; does not persist status changes. |

The service tests in `apps/tenant-api-template/src/tenant-domain.test.ts` prove the core real workflow in memory: create family, create measurement, create order, record correction, write outbox, and search. The next step is to run the same workflow against local/staging D1 and then wire the browser to it.

## What Blocks Whole-App Workability

### 1. No Real Staff Authentication

Phase 08 intentionally stopped at policy modeling. There is no login/session provider, no authenticated request context, no session cookie, no tenant membership lookup on requests, and no middleware that maps a user to a role before calling tenant data.

Impact:

- Employee creation and role assignment cannot be trusted in production.
- Any live tenant route would either be public or rely on fake headers.
- RBAC cannot protect payments, exports, settings, receipt links, support access, or WhatsApp credentials.

Required fix:

- Add an auth provider and session model.
- Store staff/user identities and tenant memberships.
- Add middleware that resolves `{ userId, tenantId, role, permissions }`.
- Enforce `authorizeTenantPermission()` at every read/mutation boundary.

### 2. Shop UI Is Fixture-Backed

The browser routes under `/shop/*` import data from `apps/web/features/core-modules/data.ts`. Key pages are presentation pages, not working forms:

- `/shop/customers` uses `familyAccounts`, read-only search example, and static profile cards.
- `/shop/measurements` uses `measurementTemplates`, `measurementVersions`, and read-only capture controls.
- `/shop/orders` uses `shopOrders` and a wizard explanation, not a submitting wizard.
- `/shop/payments` uses `shopOrders` for ledger and receipt snapshots.
- `/shop/production`, `/shop/reports`, `/shop/settings`, `/shop/security`, `/shop/release`, `/shop/whatsapp` are operational cockpits backed by fixtures/status models.
- `CoreCommandMenu` searches pilot fixtures, not `GET /v1/search`.

Required fix:

- Add a typed API client layer in `apps/web`.
- Add real server actions or route handlers for form mutations.
- Add server data loaders for customers, measurements, orders, payments, production tasks, reports, and settings.
- Replace fixture imports route-by-route, keeping fixtures only for tests/story states.

### 3. Public Gateway Does Not Proxy Tenant Domain APIs

`apps/api-gateway/src/app.ts` currently exposes:

- `GET /health`
- `GET /v1/internal/whatsapp/health`
- `GET /v1/tenant/:slug/health`

It does not expose tenant domain routes like contacts, measurements, orders, payments, or search. The tenant Worker has those routes, but the browser has no safe public path to call them with tenant resolution and auth.

Required fix:

- Add gateway routes under a tenant slug, for example:
  - `GET /v1/tenant/:slug/search`
  - `POST /v1/tenant/:slug/contacts`
  - `POST /v1/tenant/:slug/measurements`
  - `POST /v1/tenant/:slug/orders`
  - `POST /v1/tenant/:slug/orders/:orderId/payments`
- Resolve tenant from slug/domain.
- Resolve authenticated membership.
- Forward to tenant Worker with trusted internal headers only.
- Do not let the browser talk directly to tenant Worker internals.

### 4. Read Models Are Missing

The tenant API has create/payment/search endpoints, but the app needs dashboard and detail screens. Missing tenant API read endpoints:

- customer/contact list and detail.
- add profile to existing contact.
- customer timeline.
- measurement profiles by customer.
- measurement version history.
- order list with filters.
- order detail with items, snapshots, payments, receipt, notifications.
- production board/lane query.
- payment ledger by date/order/customer.
- receipt detail and printable HTML.
- reports summary endpoints.
- tenant settings/garment templates/receipt branding/staff list.

Required fix:

- Build a small set of production read-model endpoints before replacing UI fixtures.
- Keep the shape close to existing UI DTOs so pages can migrate without redesign.

### 5. Employee/Role Management Is Not Complete

The control-plane schema has `memberships`, and `packages/core/src/security.ts` has roles/permissions. There is no full staff directory flow yet.

Missing:

- user table or external identity mapping.
- invite staff flow.
- accept invite / create account.
- assign role to tenant membership.
- deactivate staff.
- audit role changes.
- UI to add/edit employees.
- tenant-level staff list API.
- route guards based on membership role.

Required fix:

- Decide whether employees live in control plane only, tenant D1 only, or both.
- Recommended v1: platform-wide `users` and `memberships` in control plane; tenant D1 stores `staff_profile` display/assignment metadata if needed.
- Use membership role for authorization and staff profile for tailor/cutter assignment labels.

### 6. Order/Production Workflow Is Not Persisted End-to-End

Order creation exists, but operational order management is incomplete.

Missing:

- persistent order status transition endpoint.
- item status transition endpoint.
- production task creation/update.
- tailor/cutter assignment.
- partial delivery workflow.
- alteration log mutations.
- cancellation/reopen rules.
- WhatsApp notification trigger after status changes.

Required fix:

- Implement state-transition services around `orders`, `order_items`, `production_tasks`, and `alteration_logs`.
- Write audit rows and search projection updates on every transition.
- Emit outbox events for ready-for-pickup, delivery, delay, cancellation, and payment reminders.

### 7. Receipts Are Metadata Only

The order/payment services upsert receipt rows, but no real customer-facing receipt exists yet.

Missing:

- receipt detail/read endpoint.
- printable receipt HTML route.
- signed receipt share token.
- R2 storage for rendered receipt snapshots/PDF/image.
- void/reissue policy.
- public receipt confirmation checks.

Required fix:

- Add receipt renderer using D1 receipt/order/payment data.
- Add signed short-lived public receipt link with tenant scope and optional mobile/order confirmation.
- Store generated assets in R2 only after the HTML receipt is stable.

### 8. WhatsApp Is Not Connected To TailorOS Outbox Yet

The tenant API writes `outbox_events`, and the connector can handle protected sends. The bridge between them is not built.

Missing:

- tenant outbox consumer.
- service-binding or signed-token call from tenant domain event to connector internal API.
- connector D1 seed records for real channel/template/consent data.
- production secrets and Meta onboarding.
- usage reconciliation with real provider exports.

Required fix:

- Build an outbox processor that reads pending tenant events and calls `POST /v1/messages/template` on the connector.
- Keep WhatsApp provider details outside TailorOS UI.
- Make failed sends visible through notification logs and connector status.

## Real-Data Smoke Test You Can Run Before UI Wiring

This is not the final app experience. It is a backend smoke path to prove real local D1 data before connecting the browser.

1. Apply local D1 migrations:

```bash
pnpm --filter @tailoros/control-plane exec wrangler d1 migrations apply CONTROL_DB --local
pnpm --filter @tailoros/tenant-api-template exec wrangler d1 migrations apply TENANT_DB --local
pnpm --filter @tailoros/whatsapp-connector exec wrangler d1 migrations apply CONNECTOR_DB --local
```

2. Run the tenant Worker locally:

```bash
pnpm --filter @tailoros/tenant-api-template exec wrangler dev --local --port 8787
```

3. Create a real family contact:

```bash
curl -sS http://127.0.0.1:8787/v1/contacts \
  -H 'content-type: application/json' \
  -H 'x-request-id: req_real_contact_01' \
  -H 'x-shop-code: MDU' \
  -d '{
    "primaryMobile": "+91 98765 43210",
    "whatsappOptIn": true,
    "createdByUserId": "usr_counter_01",
    "profiles": [
      { "fullName": "Meena Ravi", "relationLabel": "self" },
      { "fullName": "Ravi Kumar", "relationLabel": "spouse" }
    ],
    "notes": "Imported from notebook during pilot"
  }'
```

4. Copy `contactId` and one `profile.id` from the response, then create a measurement:

```bash
curl -sS http://127.0.0.1:8787/v1/measurements \
  -H 'content-type: application/json' \
  -H 'x-request-id: req_real_measurement_01' \
  -H 'x-shop-code: MDU' \
  -d '{
    "customerProfileId": "REPLACE_PROFILE_ID",
    "garmentTypeCode": "blouse",
    "displayName": "Blouse",
    "values": { "chest": 36, "waist": 31, "shoulder": 14.5, "sleeve": 11 },
    "unit": "inch",
    "fitNotes": "Regular fit",
    "reason": "Initial pilot capture",
    "capturedByUserId": "usr_measure_01"
  }'
```

5. Copy `measurementVersionId`, then create an order:

```bash
curl -sS http://127.0.0.1:8787/v1/orders \
  -H 'content-type: application/json' \
  -H 'x-request-id: req_real_order_01' \
  -H 'x-shop-code: MDU' \
  -d '{
    "contactId": "REPLACE_CONTACT_ID",
    "customerProfileId": "REPLACE_PROFILE_ID",
    "currentStatus": "booked",
    "orderDate": "2026-07-06",
    "trialDate": "2026-07-10",
    "promisedDeliveryDate": "2026-07-14",
    "discountPaise": 0,
    "createdByUserId": "usr_counter_01",
    "items": [
      {
        "garmentTypeCode": "blouse",
        "quantity": 1,
        "pricePaise": 150000,
        "measurementVersionId": "REPLACE_MEASUREMENT_VERSION_ID",
        "assignedStaffUserId": "usr_tailor_01",
        "promisedDeliveryDate": "2026-07-14"
      }
    ],
    "advancePayment": {
      "amountPaise": 50000,
      "mode": "upi",
      "reference": "UPI-PILOT-001",
      "recordedByUserId": "usr_cashier_01"
    }
  }'
```

6. Record a balance payment or correction:

```bash
curl -sS http://127.0.0.1:8787/v1/orders/REPLACE_ORDER_ID/payments \
  -H 'content-type: application/json' \
  -H 'x-request-id: req_real_payment_01' \
  -H 'x-shop-code: MDU' \
  -d '{
    "amountPaise": 100000,
    "mode": "cash",
    "kind": "balance",
    "recordedByUserId": "usr_cashier_01"
  }'
```

7. Search real D1 projection rows:

```bash
curl -sS 'http://127.0.0.1:8787/v1/search?q=meena&limit=10' \
  -H 'x-request-id: req_real_search_01' \
  -H 'x-shop-code: MDU'
```

If this path works against local D1, the domain foundation is healthy. The next milestone is to make the browser perform the same workflow through authenticated gateway calls.

## Workback Plan To Make The Whole App Workable

### Milestone 1: Real Local Pilot Harness

Goal: prove one shop can run real data through Workers without using static fixtures.

Tasks:

- Apply control-plane, tenant, and connector migrations locally.
- Add seed scripts for:
  - one pilot tenant.
  - owner, manager, counter staff, measurement taker, tailor, cashier.
  - garment templates and receipt branding.
  - WhatsApp channel/template/consent placeholder records.
- Add a backend smoke script that performs create customer -> measurement -> order -> payment -> search.
- Add a database reset/seed command for local development.

Exit criteria:

- A developer can reset local D1 and create a real order in under 10 minutes.
- Smoke script fails if any core D1 insert/search/audit/outbox step fails.

### Milestone 2: Auth, Employees, Roles

Goal: every real data request has a real user, tenant, membership, role, and permission.

Tasks:

- Choose and implement auth/session provider.
- Add control-plane `users` table if using internal auth, or external identity mapping if using managed auth.
- Add staff invite/activate/deactivate APIs.
- Add role assignment UI under `/shop/settings` or `/shop/security`.
- Add middleware in gateway and tenant Worker for authenticated context.
- Enforce role permissions for customer write, measurement write, order write, payment record/correct, settings manage, reports, exports, and support access.

Exit criteria:

- Counter staff can create customers/orders and record normal payments.
- Cashier can record payments but cannot edit measurements.
- Tailor can update assigned production tasks only.
- Owner can manage employees, settings, corrections, exports, and audits.

### Milestone 3: Tenant API Read Models

Goal: replace fixture dashboards with D1 read endpoints.

Build these first:

- `GET /v1/customers/search?q=`
- `GET /v1/customers/:contactId`
- `GET /v1/customers/:contactId/timeline`
- `GET /v1/customers/:customerProfileId/measurements`
- `GET /v1/orders`
- `GET /v1/orders/:orderId`
- `GET /v1/orders/:orderId/payments`
- `GET /v1/production/tasks`
- `GET /v1/reports/today`
- `GET /v1/settings`

Exit criteria:

- `/shop`, `/shop/customers`, `/shop/orders`, `/shop/payments`, and `/shop/reports` can load real D1 data without fixture imports.

### Milestone 4: Real Browser Mutations

Goal: staff can complete daily shop work from the UI.

Tasks:

- Build customer form:
  - search first.
  - create contact with profiles.
  - add profile to existing contact.
  - duplicate warning and override reason.
- Build measurement form:
  - pick profile and garment.
  - capture values/unit/fit notes.
  - create new version with reason.
  - show measurement history and version diff.
- Build order wizard:
  - exact profile selection.
  - multi-item entry.
  - latest measurement snapshot or explicit no-measurement reason.
  - pricing, discount, dates, staff assignment.
  - advance payment.
  - receipt generation.
- Build payment form:
  - append advance/balance/refund/correction.
  - require correction/refund reason.
  - show recalculated receipt balance.
- Build production updates:
  - item/lane status changes.
  - assigned staff.
  - delay reason.
  - alteration logs.

Exit criteria:

- A real counter user can create a new customer, capture measurement, book an order, take advance, print receipt, update production status, and close balance without touching dummy data.

### Milestone 5: Receipt and Media

Goal: receipts and measurement photos become real artifacts.

Tasks:

- Add receipt detail endpoint and printable HTML route.
- Add signed receipt public link with expiry.
- Add R2 signed upload for measurement photos.
- Add R2 signed access for receipt snapshots and media assets.
- Add lifecycle cleanup policy.

Exit criteria:

- Receipt can be printed and shared through a signed link.
- Measurement photos are scoped to tenant/customer/order and cannot be publicly guessed.

### Milestone 6: WhatsApp Outbox Bridge

Goal: TailorOS business events can safely trigger WhatsApp sends.

Tasks:

- Build tenant outbox consumer.
- Map events to connector template purposes.
- Call connector internal API through service binding or signed token.
- Persist notification logs in tenant D1.
- Seed connector D1 with real channel/template/consent data.
- Add fallback UI when sends are blocked.

Exit criteria:

- Order confirmation, trial reminder, ready pickup, balance due, and payment receipt events create connector jobs when policy allows.
- Failed/blocked sends are visible to staff.

### Milestone 7: Release Hardening

Goal: pilot can run without guessing whether production is healthy.

Tasks:

- Add Cloudflare Workers Vitest pool integration tests.
- Add Playwright smoke for the full first-shop journey.
- Add CI for test, typecheck, lint, build, preview deploy, smoke, approval, production deploy.
- Inject `RELEASE_VERSION`.
- Wire real logs/dashboards for API error rate, search p95, D1 rows, queue age, DLQ count, invalid signatures, and provisioning failures.
- Add migration fan-out and rollback/repair status.

Exit criteria:

- Release cannot proceed while any blocking gate is red.
- Pilot owner can see supportable operational state after deploy.

## Page-by-Page Fixture Replacement Plan

| Page | Current source | Replace with |
| --- | --- | --- |
| `/admin/tenants` | static tenant lifecycle data | control-plane `GET /v1/tenants`, `GET /v1/tenants/:tenantId`, retry/suspend mutations behind platform admin auth. |
| `/admin/domain-model` | implementation status docs | live domain health, schema version, migration status, D1 smoke status. |
| `/shop` | `shopOrders`, `whatsAppFailures`, helper fixtures | `GET /v1/reports/today`, `GET /v1/production/tasks`, connector overview. |
| `/shop/customers` | `familyAccounts`, `shopOrders`, `whatsAppFailures` | customer search/detail/timeline endpoints and create/add-profile mutations. |
| `/shop/measurements` | `measurementTemplates`, `measurementVersions` | settings templates, measurement profile/version endpoints, R2 photo upload. |
| `/shop/orders` | `shopOrders`, static wizard cards | order list/detail endpoints and submitting order wizard. |
| `/shop/production` | production fixtures derived from `shopOrders` | production task list/update/status endpoints. |
| `/shop/payments` | `shopOrders` ledger rows | order payment ledger and payment mutation endpoints; receipt detail route. |
| `/shop/reports` | `shopOrders` computed summaries | report endpoints backed by D1 queries/projections. |
| `/shop/settings` | `settingsItems`, `measurementTemplates` | tenant settings, garment templates, staff roles, receipt branding APIs. |
| `/shop/whatsapp` | connector readiness fixtures | connector `GET /v1/admin/overview` and tenant notification logs. |
| `/shop/security` | policy fixtures | real session, membership, support grants, audit logs. |
| `/shop/release` | release gate fixtures | CI/build/deploy/test telemetry and alert source data. |

## Critical Edge Cases To Validate With Real Data

- One mobile number with multiple family profiles.
- Duplicate mobile variants: `+91`, leading zero, spaces, and `0091`.
- Add a new profile under existing contact without creating duplicate contact.
- Measurement version v1 used by an old order remains unchanged after v2 is created.
- Order item with measurement override does not mutate permanent measurement.
- Multi-item order with one item ready and another stitching.
- Partial delivery at item level while order remains active.
- Advance cannot exceed order total.
- Payment correction/refund requires reason and owner/manager permission.
- Receipt balance always matches ledger.
- Tailor cannot see reports, exports, or payment correction.
- Counter cannot correct payments or manage staff.
- Owner can add/deactivate employee and audit role changes.
- Tenant A staff cannot read Tenant B data.
- Suspended tenant cannot dispatch.
- WhatsApp opt-out blocks non-required sends.
- Duplicate WhatsApp webhook is ignored.
- Out-of-order WhatsApp status cannot downgrade delivered/read.
- DLQ count blocks release approval.

## Recommended Implementation Order

1. Build auth/session/membership first. Without this, real data is unsafe.
2. Add gateway proxy routes for tenant domain APIs.
3. Add tenant read models for dashboard, customer, order, payment, production, and settings.
4. Wire `/shop/customers` to real search/create flows.
5. Wire `/shop/measurements` to real versioned measurement capture.
6. Wire `/shop/orders` to real order creation and detail.
7. Wire `/shop/payments` and receipt rendering.
8. Wire production status transitions and partial delivery.
9. Wire staff management and role guards in settings/security.
10. Wire WhatsApp outbox bridge.
11. Add real E2E tests and release gates.

This order avoids a common failure mode: building attractive forms first, then discovering that auth, tenant routing, and read models cannot safely support them.

## Minimum Pilot Acceptance Criteria

The app is workable for one real shop when all of these pass:

- Owner can log in and see only their tenant.
- Owner can add counter, measurement, tailor, cashier, and manager staff.
- Counter can search by mobile/name/order/receipt.
- Counter can create contact and multiple family profiles.
- Measurement staff can create measurement versions with unit and reason.
- Counter can create order with one or more items and selected measurement snapshots.
- Cashier can record advance and balance payments.
- Owner/manager can record corrections with reason.
- Receipt can be printed and shared safely.
- Tailor/cutter can update assigned production tasks.
- Reports show real dues, balances, overdue work, and ready pickup.
- WhatsApp sends are either successfully queued through connector policy or visibly blocked with fallback action.
- Audit logs exist for sensitive actions.
- Playwright smoke creates a full real order lifecycle in staging.
- Release cockpit has zero blocking gates before production deploy.

## Next File/Code Areas To Touch

- `apps/api-gateway/src/app.ts`: add authenticated tenant proxy routes.
- `apps/control-plane/migrations/0001_control_plane.sql`: add user/invite/session or identity mapping tables if internal auth is selected.
- `apps/control-plane/src/app.ts`: add staff/membership management endpoints.
- `apps/tenant-api-template/migrations/0001_tenant_domain.sql`: add staff profile/settings tables if tenant-local display metadata is needed.
- `apps/tenant-api-template/src/app.ts`: add read endpoints, status mutations, idempotency middleware, receipt/media routes.
- `apps/tenant-api-template/src/domain-service.ts`: add profile-add, status-transition, production, receipt, media, and search rebuild services.
- `apps/web/features/core-modules`: replace fixture data access with API data loaders and mutation actions.
- `apps/web/app/shop/*`: convert static sections into real forms, loading states, error states, and optimistic-safe flows.
- `apps/whatsapp-connector`: seed/admin endpoints for channel/template/consent setup.
- `apps/whatsapp-consumer`: connect tenant outbox processing once template mapping is ready.
- `.github/workflows` or equivalent CI: add Phase 09 gates.

## Bottom Line

The project has a solid architecture and meaningful domain foundation, but it is not yet a real shop operating app through the UI. The immediate path is not another visual phase. The next phase should be a real-data integration phase: auth + tenant gateway + read models + form mutations + local D1 seed/smoke. Once those are in place, the existing premium UI can become the actual operating surface for adding customers, employees, measurements, orders, payments, receipts, production updates, and WhatsApp follow-up.
