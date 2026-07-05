# ADR 0001: Cloudflare Tenant-Isolated SaaS Pattern

## Status

Accepted

## Context

TailorOS needs a low-cost, fast, multi-tenant architecture for tailor shops in Tamil Nadu, plus a reusable WhatsApp Connector that can later support other SMB products. The PRDs require strict tenant isolation, auditable support access, background jobs, receipt/media storage, and a web-first staff experience.

## Decision

Use a TypeScript monorepo with separate deployables for the Next.js web app, API gateway Worker, control-plane Worker, tenant API template Worker, WhatsApp Connector Worker, and queue consumers. Shared contracts and domain rules live under `packages/`.

Runtime responsibilities:

- `apps/web`: App Router UI, public receipt/onboarding pages, and design-system reference.
- `apps/api-gateway`: public API boundary, request IDs, tenant resolution, auth/rate-limit hooks, service binding dispatch.
- `apps/control-plane`: tenant lifecycle, D1 provisioning orchestration, migrations, exports, and platform admin operations.
- `apps/tenant-api-template`: tenant-plane TailorOS APIs with one tenant D1 binding per deployed tenant.
- `apps/whatsapp-connector`: Meta webhook entry, template send API, messaging policy, and provider adapter boundary.
- `apps/whatsapp-consumer`: outbound and webhook queue processing.

## Consequences

This keeps business logic out of the UI and out of the API gateway. It also makes service boundaries testable and deployable independently. The cost is more package/config discipline early, which is acceptable because the later phases depend on strong tenant and integration boundaries.
