# ADR 0003: WhatsApp as a Reusable Connector Product

## Status

Accepted

## Context

TailorOS needs WhatsApp confirmations, receipts, reminders, pickup alerts, status lookup, and opt-out handling. The WhatsApp PRD explicitly rejects hardcoding provider behavior into TailorOS.

## Decision

TailorOS emits business events and notification requests. The WhatsApp Connector owns provider credentials, template mapping, Meta webhook verification, delivery status normalization, inbound routing, opt-in/opt-out enforcement, idempotency, provider adapters, and usage evidence.

Meta WhatsApp Cloud API direct is the first provider. Future providers must implement small adapter interfaces rather than branching provider-specific logic throughout TailorOS.

## Consequences

TailorOS remains a shop operating system instead of becoming a messaging product. The connector can serve future SMB products. The tradeoff is extra internal API and queue contracts, which Phase 01 establishes through shared schemas and versioned queue envelopes.
