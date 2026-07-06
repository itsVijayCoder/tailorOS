# ADR 0002: Control DB plus Per-Tenant D1 Databases

## Status

Accepted

## Context

The product must avoid mixing shop data, support tenant export/delete workflows, and keep customer/order/measurement history isolated. The Cloudflare stack guide recommends a control database plus per-tenant D1 databases.

## Decision

Use one control-plane D1 database for platform records and one tenant D1 database per shop for operational records.

The control database owns tenant registry, domains, provisioning state, tenant database metadata, worker routing metadata, memberships, plan state, integration registry, and platform audit records.

Each tenant database owns family contacts, customer profiles, measurement versions, orders, order items, payments, receipts, search projections, WhatsApp notification logs, outbox jobs, and tenant audit logs.

## Consequences

Per-tenant D1 lowers cross-tenant blast radius and makes export/delete easier. Cross-tenant reporting cannot rely on SQL joins across tenant databases; later phases must use queue-driven projections for platform-wide reporting.
