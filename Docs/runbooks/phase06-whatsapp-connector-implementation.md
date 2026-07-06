# Phase 06 WhatsApp Connector Implementation

Date: 2026-07-06

## Source Analysis

Phase 06 is defined by four source documents: `Docs/TailorOS_Final_PRD.html`, `Docs/Whatsapp_Chat_Final_PRD.html`, `Docs/Tech-stack/TailorOS_CF_Stack_Implementation_Guide.html`, and `Docs/Phase-Wise/Phase06_whatsapp_connector.html`. The requested PRD path `Docs/Phase-Wise Docs/TailorOS_Final_PRD.html` does not exist in the repo; the canonical TailorOS PRD is `Docs/TailorOS_Final_PRD.html`.

The product decision is consistent across the documents: TailorOS remains the shop operating system, while WhatsApp is a separate reusable connector product. TailorOS emits business events and stores normalized notification state. The connector owns Meta Cloud API credentials, provider-specific template names, webhook verification, delivery status normalization, consent and opt-out policy, provider retry behavior, and usage evidence.

The Cloudflare stack guide sets the technical boundary. The connector is a separate Worker with public webhook routes and private internal send APIs. Queue consumers perform provider sends and webhook processing. D1 stores connector control data, message requests, webhook event dedupe records, usage ledger rows, and support/audit evidence. Secrets must remain in Workers secrets or encrypted credential records, not in frontend code or committed config.

## Phase 06 Scope

- Multi-tenant channel account model for Meta-first WhatsApp connections.
- Internal template send contract with service-binding or signed service-token protection.
- Template mapping from internal purpose to provider template name and language.
- Consent, opt-out, missing template, provider health, idempotency, and blocked-send policy.
- Meta provider adapter interface for template sends, service-window text sends, signature verification, and webhook normalization.
- Webhook ingestion that verifies Meta signatures, routes by phone number ID, dedupes provider events, and enqueues normalized work.
- Queue consumer that sends template jobs, records provider acceptance/failure, retries transient failures, and processes webhook events idempotently.
- Status ranking so out-of-order webhooks never downgrade message state.
- Shared-mobile safety model for inbound STATUS, RECEIPT, DUE, HELP, STOP, and unknown-number flows.
- UI surface for connector readiness, channel health, template mapping, send policy, webhook health, queue/DLQ posture, usage ledger, and edge-case coverage.

## Implementation Decisions

- Keep Next.js route pages server-first. Add interactivity only where needed and keep the client bundle narrow.
- Use the existing Phase 02 design-system tokens and primitives: `bg-page`, `bg-surface`, `bg-surface-strong`, `border-hairline`, `text-ink-body`, `text-ink-display`, `text-ink-muted`, `bg-accent`, `bg-signal`, and the `apps/web/components/ui` primitives.
- Keep provider logic outside TailorOS UI and outside tenant API domain services.
- Add shared policy/provider packages so both the connector Worker and consumer Worker use the same status ranking, policy checks, Meta adapter, and webhook normalization.
- Use Zod schemas at all system boundaries and `safeParse` for untrusted input.
- Use Cloudflare bindings and Queues. Do not call Cloudflare REST APIs from hot Worker paths.
- Declare secret names in `wrangler.jsonc` for type generation and validation, but never commit secret values.
- Make the Meta Graph API version configurable and default it to the latest official Graph API version identified during implementation review.

## Critical Edge Cases

- Browser or public clients attempt to call internal send API directly.
- Missing consent blocks outbound utility messages.
- Existing opt-out blocks all non-required messages.
- Template mapping is missing, unapproved, paused, rejected, or disabled.
- Provider health or credential status is not active.
- Duplicate idempotency key is retried by TailorOS or a queue.
- Provider accepts a message but never sends a final delivery webhook.
- Duplicate webhook events arrive.
- Delivered/read statuses arrive before sent, or sent arrives after read.
- Meta webhook signature is missing or invalid.
- Phone number ID does not map to an active channel account.
- Shared family mobile has multiple active orders and must trigger disambiguation.
- Unknown inbound phone must not reveal order/customer data.
- STOP or local opt-out phrase must create an opt-out policy record.
- Usage ledger must distinguish delivered, failed, and blocked, not only accepted.

## Acceptance Checklist

- Internal send API is protected and returns structured blocked reasons.
- Template send with approved mapping queues exactly one send job and stores an idempotency key.
- Missing consent and opted-out recipients are blocked before provider calls.
- Meta adapter can construct template and service-window text requests without TailorOS imports.
- Webhook GET verification checks verify-token hash and returns the challenge exactly.
- Webhook POST validates HMAC signature before enqueueing normalized events.
- Duplicate webhook event handling is idempotent.
- Status ranking prevents downgrades from out-of-order webhooks.
- Queue consumer retries transient provider failures and records terminal failures.
- UI gives support/admins clear visibility into channel status, templates, queue/DLQ, usage, and shared-mobile safety.
- Completion docs record what was finished, what remains, verification results, and edge-case coverage.

## Completed Implementation

### Shared Contracts and Policy

- Expanded `@tailoros/schemas` WhatsApp contracts for provider/channel/template status, connector channel snapshots, template mappings, send jobs, webhook jobs, and normalized webhook events.
- Added `@tailoros/message-policy` with reusable policy checks for consent, opt-out, missing templates, provider health, idempotency, service-window gating, shared-mobile inbound handling, and status ranking.
- Added `@tailoros/whatsapp` with a provider adapter abstraction, Meta Cloud API template/text send support, HMAC webhook signature verification, provider response normalization, and webhook normalization.

### Connector and Consumer Workers

- Replaced the connector scaffold with protected internal send routes, Meta webhook verification routes, D1-backed readiness/idempotency/webhook stores, overview health data, and queue dispatch.
- Replaced the consumer scaffold with queue processing for `whatsapp.send-template` and `whatsapp.process-webhook`, transient retry handling, terminal failure recording, status-rank protection, and inbound opt-out recording.
- Added the Phase 06 connector D1 migration for product installations, channels, credentials, template mappings, consents, message requests, outbox jobs, webhook events, conversation state, usage ledger, and audit logs.
- Updated Wrangler configs with current compatibility dates, configurable `META_GRAPH_API_VERSION`, and required secret declarations.

### TailorOS Boundary Safety

- Disabled the older tenant API direct queue stub at `/v1/orders/:orderId/notification-outbox`.
- That endpoint now returns a shared `SERVICE_UNAVAILABLE` envelope explaining that tenant APIs must call the connector internal send API with a signed service token and full template payload.
- Added a regression test so the tenant API cannot enqueue invalid `{ orderId }` WhatsApp jobs directly.

### Phase 06 UI

- Added `/shop/whatsapp` as a premium, dense connector cockpit in the existing shop shell.
- Added navigation support for the WhatsApp module while keeping the Phase 02 design-system tokens and UI primitives.
- Added typed UI fixtures and derived helper signals for:
  - channel health and credential rotation
  - template mapping readiness
  - queue backlog, retryable failures, and DLQ
  - policy blocks
  - webhook duplicate/stale/profile-scope handling
  - shared-mobile inbound safety
  - usage ledger evidence and estimated cost
- Added tests for connector signal derivation, template readiness, retry/DLQ classification, webhook reliability, and command-search routing to `/shop/whatsapp`.

## Edge-Case Coverage

| Edge case | Status |
| --- | --- |
| Browser/public client calls internal send API | Covered by connector bearer-token guard tests. |
| Missing consent | Covered by policy package and connector route tests. |
| Existing opt-out | Covered by policy package, consumer inbound STOP handling, and UI fixtures. |
| Missing/paused/pending template mapping | Covered by policy package, UI readiness signals, and search tests. |
| Provider health or credential blocked | Covered by policy package and UI channel/DLQ fixtures. |
| Duplicate idempotency key | Covered by connector route tests and UI duplicate request fixture. |
| Transient provider failure | Covered by consumer retry tests. |
| Terminal/DLQ provider failure | Covered by consumer retry-limit tests and UI signal tests. |
| Invalid Meta webhook signature | Covered by connector webhook tests. |
| Duplicate webhook event | Covered by connector tests and UI reliability tests. |
| Out-of-order status downgrade | Covered by policy package status-rank tests and UI stale webhook fixture. |
| Shared family mobile inbound ambiguity | Covered by policy package shared-mobile tests and UI safety panel. |
| STOP/local opt-out phrase | Covered for English and Tamil phrase normalization in policy tests and consumer tests. |
| Usage/cost evidence visibility | Covered by D1 schema and UI ledger fixtures; real provider reconciliation remains rollout work. |

## Verification

- `pnpm test` passed after backend implementation: 13 files, 57 tests.
- `pnpm --filter @tailoros/web lint` passed, including `theme:check`.
- `pnpm --filter @tailoros/web typecheck` passed.
- `pnpm --filter @tailoros/web build` passed and statically generated `/shop/whatsapp`.
- `pnpm --filter @tailoros/tenant-api-template typecheck` passed after the boundary guard.
- `pnpm typecheck` passed after all changes: 11 packages successful.
- `pnpm test` passed after all changes: 13 files, 63 tests.
- Local HTTP smoke check passed: `curl http://127.0.0.1:3000/shop/whatsapp` returned 200 and included the Phase 06 cockpit sections.

Rendered browser QA note: the Browser plugin runtime loaded, but `iab` was unavailable and `agent.browsers.list()` returned `[]`. Workspace Playwright was also not installed (`pnpm exec playwright --version` failed with `Command "playwright" not found`). I did not add a temporary browser dependency just for screenshots. The page was verified with build/type/lint/tests plus server-rendered HTML smoke checks.

## Commit History

- `9869688 docs: analyze phase 06 whatsapp connector`
- `33b8379 feat(whatsapp): implement phase 06 connector workers`
- `9de122a feat(web): add phase 06 whatsapp cockpit`
- `eb0310c fix(tenant-api): guard whatsapp connector boundary`

## Remaining Production Work

- Wire tenant-domain event emitters to the connector internal send API through service binding or signed service-token calls.
- Seed real connector D1 records for product installations, channel accounts, template mappings, contact consents, and encrypted credential metadata.
- Configure production secrets: `INTERNAL_SERVICE_TOKEN`, `META_APP_SECRET`, Meta access tokens, and webhook verify-token hash.
- Run the D1 migration against staging and production, then add data backfill jobs for existing consent/template state.
- Complete Meta WABA onboarding, template approval, phone-number verification, and quality-rating support workflows.
- Add observability dashboards and alerts for queue age, DLQ depth, provider error rate, webhook signature failures, template drift, and cost anomalies.
- Add a rendered-browser E2E suite once Browser/Playwright is available in the workspace, covering desktop/mobile layout and command-search interaction.
- Reconcile usage ledger rows with real Meta conversation exports and lock the monthly billing evidence workflow.
