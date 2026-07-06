# Phase 01 Local Development

## Install

```bash
pnpm install
```

## Web app

```bash
pnpm dev
```

The web app runs from `apps/web` and keeps the existing homepage at `/`.

## Quality gates

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm arch
```

## Cloudflare type generation

Run this after changing a Worker `wrangler.jsonc`:

```bash
pnpm --filter @tailoros/api-gateway cf-typegen
pnpm --filter @tailoros/control-plane cf-typegen
pnpm --filter @tailoros/tenant-api-template cf-typegen
pnpm --filter @tailoros/whatsapp-connector cf-typegen
pnpm --filter @tailoros/whatsapp-consumer cf-typegen
```

Generated Worker types must match the binding names in `wrangler.jsonc`.
