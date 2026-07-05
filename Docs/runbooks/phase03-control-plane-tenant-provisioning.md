# Phase 03 Completion Report - Control Plane Tenant Provisioning

Prepared: 2026-07-05

## Completed

- Added shared Zod contracts for tenant lifecycle states, provisioning steps, job statuses, queue payloads, and provisioning/admin response shapes in `packages/schemas`.
- Added control DB D1 migration `apps/control-plane/migrations/0001_control_plane.sql` with platform-only tables: `tenants`, `memberships`, `tenant_database_registry`, `tenant_worker_registry`, `provisioning_jobs`, and `platform_audit_logs`.
- Implemented control-plane signup with Turnstile verification, idempotency key handling, slug conflict detection, tenant/job reservation, and queue enqueue.
- Implemented queue-backed provisioning orchestration with `simulated`, `manual`, and `automated` modes.
- Implemented recoverable failure recording for validation, D1 create, migration, seed, worker registration, and manual-review states.
- Added admin control-plane endpoints: tenant list, tenant detail, retry provisioning, and tenant suspension.
- Added API gateway dispatch guard: tenant dispatch now requires an active tenant and healthy worker registry row before invoking the tenant API binding.
- Added premium `/admin/tenants` dashboard for tenant status, lifecycle, D1/queue registry, and recovery lanes using TailorOS design-system tokens and primitives.
- Linked the control-plane dashboard from the homepage.
- Regenerated Wrangler binding types after adding required secrets and provisioning vars.
- Added focused tests for idempotent signup, duplicate slug handling, queue lifecycle, failure recording, retry, and suspended dispatch blocking.

## Edge-Case Coverage

| Edge case                              | Status                         | Implementation                                                                                                          |
| -------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Duplicate shop slug                    | Covered                        | Unique DB constraint plus `TenantSlugConflictError` and `409 CONFLICT` response.                                        |
| Signup page refresh                    | Covered                        | `Idempotency-Key` header or deterministic fallback returns the existing tenant/job without duplicate queue messages.    |
| D1 create succeeds but migration fails | Covered in lifecycle model     | Registry is written before migration; migration failures mark `failed_migration` and remain retryable.                  |
| Migration failure records failing step | Covered                        | `ProvisioningStepError` maps to job `step`, tenant status, audit row, and last error.                                   |
| Tenant activation before health check  | Covered in simulated lifecycle | `active` is set only after worker registry reaches `healthy`. Automated mode queues migration and does not mark active. |
| Cloudflare API token permission issue  | Covered                        | D1 create failure records `failed_db_create`; secrets are declared as required Wrangler secrets, not vars.              |
| Tenant suspension                      | Covered                        | Control-plane suspend endpoint marks tenant suspended; API gateway returns `403` before tenant Worker dispatch.         |
| Inactive tenant dispatch               | Covered                        | Gateway requires `active` + `healthy` worker mapping.                                                                   |

## Remaining Production Work

- Apply `0001_control_plane.sql` to the local/staging control D1 database with Wrangler migrations.
- Add the real tenant migration consumer once dynamic tenant D1 migration strategy is finalized.
- Add Workers for Platforms dispatch namespace registration for production scale.
- Add platform-admin authentication/RBAC around all `/v1/tenants/*` control-plane routes.
- Add staging integration tests against a real D1 database using Cloudflare's Workers test pool or Miniflare D1.
- Add alerting for jobs that remain in running states beyond an SLA.
- Add tenant export/delete workflows and receipt-link preservation policy for suspended tenants.
- Replace the static `/admin/tenants` sample data with authenticated data from the control-plane Worker.

## Operational Notes

- Set secrets with Wrangler, never in config:
  - `pnpm --filter @tailoros/control-plane wrangler secret put CF_API_TOKEN`
  - `pnpm --filter @tailoros/control-plane wrangler secret put TURNSTILE_SECRET_KEY`
- Local mode is `TENANT_PROVISIONING_MODE=simulated`, so tests and local demos can complete without real Cloudflare D1 creation.
- Production automation should use `TENANT_PROVISIONING_MODE=automated`; the control-plane Worker creates D1 through the Cloudflare admin API, writes registry metadata, and queues migration work without marking the tenant active.
- Manual pilot onboarding can use `TENANT_PROVISIONING_MODE=manual`; the job moves to `needs_manual_review` with an audit trail instead of pretending automation completed.
