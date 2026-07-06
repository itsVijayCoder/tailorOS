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
