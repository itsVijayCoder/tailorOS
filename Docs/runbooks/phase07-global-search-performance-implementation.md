# Phase 07 Global Search and Performance Implementation

Updated: July 6, 2026

## Source Documents Reviewed

- `Docs/TailorOS_Final_PRD.html`
- `Docs/Whatsapp_Chat_Final_PRD.html`
- `Docs/Tech-stack/TailorOS_CF_Stack_Implementation_Guide.html`
- `Docs/Phase-Wise/Phase07_global_search_performance.html`
- Existing design-system reference at `/admin/design-system`

## Completed

- Added shared tenant search parsing in `@tailoros/core` for mobile prefixes, exact customer/order/receipt codes, delivery shortcuts, and FTS text.
- Added D1 `search_projection` schema with exact lookup indexes for mobile, customer code, order code, receipt code, and status/date.
- Updated tenant-domain writes so contacts, profiles, orders, receipts, and payment updates maintain indexed projection rows plus FTS rows.
- Updated `/v1/search` to return `{ results, meta }` with query kind, strategy, latency budget, result count, and elapsed time.
- Upgraded the shop command palette with 150ms debounce, abortable requests, stale-response protection, recent-result cache, hit-type labels, and strategy telemetry.
- Added `/shop/search` as the Phase 07 operational search and speed cockpit.
- Added tests for parser classification, search response schema, projection writes, migration indexes, delivery shortcuts, mobile-prefix ranking, and async cancellation.

## Edge-Case Coverage

- Shared family mobile numbers return the family/contact before individual profiles.
- Partial mobile prefixes are treated as indexed mobile-prefix searches.
- Exact order, customer, and receipt codes rank above FTS results.
- One-character queries remain idle.
- Delivery shortcuts use status/date semantics instead of free-text scanning.
- Stale command-search responses cannot overwrite newer results.
- WhatsApp evidence is searched through projection summaries, not raw provider payload scans.
- Payment corrections update order and receipt projection rows.

## Still Needed

- Run real D1 benchmark seeds for 10k contacts, 30k profiles, and 50k orders.
- Add query-plan CI checks with `EXPLAIN QUERY PLAN` once the local D1 test harness is wired.
- Switch the web command menu from pilot fixtures to the tenant API once auth/session routing exists.
- Add D1 Sessions when read replication is enabled and read-after-write consistency is required.
- Build the platform-wide projection worker for support/admin search; do not fan out live queries across tenant D1 databases.
- Run Lighthouse/WebPageTest against dashboard, command search, and public receipt pages after deployment.
- Add virtualization only when visible customer/order lists exceed 100 rows.
