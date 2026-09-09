# VANTREX

VANTREX is a monochrome iGaming showcase and affiliate cockpit with Clerk authentication, admin-managed partner catalogues, referral progression, hourly rewards, and USDT payout requests.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/vantrex/src/App.tsx` — authenticated player, mandatory onboarding, showcase, profile, and admin routes.
- `artifacts/vantrex/src/index.css` — monochrome VANTREX visual system and responsive layout.
- `artifacts/api-server/src/routes/vantrex.ts` — authenticated platform, game, profile, referral, and withdrawal endpoints.
- `artifacts/api-server/src/routes/storage.ts` — authenticated presigned upload URL and object serving endpoints.
- `lib/api-spec/openapi.yaml` — source-of-truth API contract.
- `lib/db/src/schema/vantrex.ts` — PostgreSQL schema for VANTREX records.

## Architecture decisions

- Clerk is the authentication provider so Google OAuth and email/password flows are managed securely outside the app.
- The catalogue starts empty by design; platforms only contain category/logo identity and games own their direct affiliate destinations.
- Native image inputs upload directly to App Storage through short-lived presigned URLs; PostgreSQL stores only the resulting object paths.
- Affiliate destinations are stored server-side and only used as click targets from the Play now action.

## Product

- Player landing page and Clerk sign-in/sign-up.
- RU/EN onboarding with username availability and active platform selection.
- Mandatory onboarding blocks the showcase until a unique username and avatar are saved.
- Mobile-first showcase with Casino/Sports Betting toggle, platform cards, platform-specific game/event lists, and game-owned Play links.
- Profile editing with native avatar upload, language switching, referral link, live reward balance, tier progress, and payout modal.
- Restricted admin CRUD for platforms and games/bets plus withdrawal status management.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `pnpm --filter @workspace/api-spec run codegen` must be run after OpenAPI changes.
- `pnpm --filter @workspace/db run push` applies development schema changes; publishing handles production schema diffs.
- Clerk browser development keys are expected in preview and are automatically separated from production after publish.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
